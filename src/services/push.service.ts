const API_URL = process.env.NEXT_PUBLIC_API_URL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  async subscribeUser(token: string): Promise<{ success: boolean; message: string }> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push messaging is not supported in your browser');
    }

    try {
      console.log('Push: Waiting for Service Worker to be ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Push: Service Worker is ready', registration);
      
      // Check for existing subscription
      console.log('Push: Checking for existing subscription...');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('Push: No existing subscription found. Subscribing new user...');
        if (!VAPID_PUBLIC_KEY) {
          throw new Error('VAPID public key is not defined in environment variables');
        }

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          });
          console.log('Push: Subscription successful', subscription);
        } catch (subError: any) {
          console.error('Push: Subscribe call failed:', subError);
          // Special handling for common errors
          if (subError.name === 'NotAllowedError') {
            throw new Error('Izin notifikasi ditolak oleh browser');
          }
          throw new Error(`Gagal mendaftarkan push service: ${subError.message || 'Error tidak diketahui'}`);
        }
      } else {
        console.log('Push: Existing subscription found', subscription);
      }

      // Send subscription to backend
      console.log('Push: Sending subscription to backend...');
      const response = await fetch(`${API_URL}/push-subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      const result = await response.json();
      console.log('Push: Backend response:', result);

      if (!response.ok) {
        throw new Error(`Gagal menyimpan ke server: ${result.message || response.status}`);
      }

      return result;
    } catch (error: any) {
      console.error('Push Subscription Error:', error);
      throw error;
    }
  },

  async unsubscribeUser(token: string): Promise<{ success: boolean }> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from backend first
        await fetch(`${API_URL}/push-unsubscribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Unsubscribe from browser
        await subscription.unsubscribe();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Push Unsubscription Error:', error);
      throw error;
    }
  },

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  async getSubscription(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  }
};
