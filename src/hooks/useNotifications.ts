import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Medicine, UserSettings } from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  medicine_id?: string;
  type: 'low_stock' | 'expiry' | 'critical_stock' | 'general';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const createNotification = async (
    type: 'low_stock' | 'expiry' | 'critical_stock' | 'general',
    title: string,
    message: string,
    medicineId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          medicine_id: medicineId,
          type,
          title,
          message,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      setNotifications(prev => [data as Notification, ...prev]);
      
      // Show toast notification
      toast({
        title,
        description: message,
        variant: type === 'critical_stock' ? 'destructive' : 'default'
      });

      return data;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  const checkForAlerts = async (medicines: Medicine[], settings: UserSettings) => {
    const today = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(today.getDate() + (settings.expiry_alert_days || 30));

    for (const medicine of medicines) {
      const totalStock = medicine.strips * medicine.tablets_per_strip + medicine.remaining_tablets_in_current_strip;
      
      // Critical stock alert
      if (totalStock <= (settings.critical_stock_threshold || 5)) {
        await createNotification(
          'critical_stock',
          'Critical Stock Alert!',
          `${medicine.name} has only ${totalStock} tablets remaining. Immediate restocking required!`,
          medicine.id
        );
      }
      // Low stock alert
      else if (totalStock <= (settings.low_stock_threshold || 10)) {
        await createNotification(
          'low_stock',
          'Low Stock Alert',
          `${medicine.name} is running low with ${totalStock} tablets remaining. Consider restocking soon.`,
          medicine.id
        );
      }

      // Expiry alert
      if (medicine.expiry_date) {
        const expiryDate = new Date(medicine.expiry_date);
        if (expiryDate <= expiryThreshold && expiryDate >= today) {
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          await createNotification(
            'expiry',
            'Expiry Alert',
            `${medicine.name} will expire in ${daysUntilExpiry} days (${medicine.expiry_date}). Please check and use before expiry.`,
            medicine.id
          );
        }
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkForAlerts,
    fetchNotifications
  };
};