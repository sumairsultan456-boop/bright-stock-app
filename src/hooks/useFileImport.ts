import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { toast } from '@/hooks/use-toast';
import { Medicine } from '@/types/database';

export interface ImportRow {
  name: string;
  mrp: number;
  strips: number;
  tablets_per_strip: number;
  remaining_tablets_in_current_strip: number;
  expiry_date: string;
  description?: string;
  category: string;
  unit_type: string;
}

export interface ImportResult {
  success: ImportRow[];
  errors: { row: number; data: any; error: string }[];
  total: number;
}

export const useFileImport = () => {
  const [loading, setLoading] = useState(false);

  const validateRow = (row: any, index: number): { valid: boolean; error?: string; data?: ImportRow } => {
    try {
      // Required fields validation
      if (!row.name || typeof row.name !== 'string' || row.name.trim().length === 0) {
        return { valid: false, error: 'Name is required and must be a non-empty string' };
      }

      const mrp = parseFloat(row.mrp || row.MRP || 0);
      if (isNaN(mrp) || mrp < 0) {
        return { valid: false, error: 'MRP must be a valid positive number' };
      }

      const strips = parseInt(row.strips || row.Strips || 0);
      if (isNaN(strips) || strips < 0) {
        return { valid: false, error: 'Strips must be a valid non-negative number' };
      }

      const tabletsPerStrip = parseInt(row.tablets_per_strip || row['Tablets per Strip'] || row.tabletsPerStrip || 10);
      if (isNaN(tabletsPerStrip) || tabletsPerStrip <= 0) {
        return { valid: false, error: 'Tablets per strip must be a valid positive number' };
      }

      const remainingTablets = parseInt(row.remaining_tablets_in_current_strip || row['Remaining Tablets'] || row.remainingTablets || 0);
      if (isNaN(remainingTablets) || remainingTablets < 0 || remainingTablets > tabletsPerStrip) {
        return { valid: false, error: `Remaining tablets must be between 0 and ${tabletsPerStrip}` };
      }

      // Date validation
      let expireDate = new Date().toISOString().split('T')[0]; // Default to today
      if (row.expire_date || row['Expire Date'] || row.expireDate) {
        const dateStr = row.expire_date || row['Expire Date'] || row.expireDate;
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          return { valid: false, error: 'Expire date must be a valid date' };
        }
        expireDate = parsedDate.toISOString().split('T')[0];
      }

      const data: ImportRow = {
        name: row.name.trim(),
        mrp,
        strips,
        tablets_per_strip: tabletsPerStrip,
        remaining_tablets_in_current_strip: remainingTablets,
        expiry_date: expireDate,
        description: row.description || row.Description || '',
        category: row.category || row.Category || 'medicine',
        unit_type: row.unit_type || row['Unit Type'] || row.unitType || 'tablet'
      };

      return { valid: true, data };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error}` };
    }
  };

  const importFromCSV = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const success: ImportRow[] = [];
          const errors: { row: number; data: any; error: string }[] = [];

          results.data.forEach((row: any, index: number) => {
            const validation = validateRow(row, index);
            if (validation.valid && validation.data) {
              success.push(validation.data);
            } else {
              errors.push({
                row: index + 1,
                data: row,
                error: validation.error || 'Unknown error'
              });
            }
          });

          resolve({
            success,
            errors,
            total: results.data.length
          });
        },
        error: (error) => {
          resolve({
            success: [],
            errors: [{ row: 0, data: {}, error: `CSV parsing error: ${error.message}` }],
            total: 0
          });
        }
      });
    });
  };

  const importFromExcel = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const success: ImportRow[] = [];
          const errors: { row: number; data: any; error: string }[] = [];

          jsonData.forEach((row: any, index: number) => {
            const validation = validateRow(row, index);
            if (validation.valid && validation.data) {
              success.push(validation.data);
            } else {
              errors.push({
                row: index + 1,
                data: row,
                error: validation.error || 'Unknown error'
              });
            }
          });

          resolve({
            success,
            errors,
            total: jsonData.length
          });
        } catch (error: any) {
          resolve({
            success: [],
            errors: [{ row: 0, data: {}, error: `Excel parsing error: ${error.message}` }],
            total: 0
          });
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const processImport = async (file: File): Promise<ImportResult> => {
    setLoading(true);
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      let result: ImportResult;
      if (fileExtension === 'csv') {
        result = await importFromCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        result = await importFromExcel(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      toast({
        title: "Import Complete",
        description: `Processed ${result.total} rows: ${result.success.length} successful, ${result.errors.length} errors`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      return {
        success: [],
        errors: [{ row: 0, data: {}, error: error.message }],
        total: 0
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    processImport,
    loading
  };
};