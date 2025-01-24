import React from 'react';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  daysLeft: number;
  type: 'assignment' | 'schedule';
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const getNotificationColor = (daysLeft: number) => {
  if (daysLeft <= 1) return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' };
  if (daysLeft <= 2) return { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800' };
  if (daysLeft <= 3) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' };
  return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' };
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  isOpen, 
  onClose, 
  notifications 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-[rgba(255,140,90,1)] text-white p-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Bell className="h-8 w-8" />
            <h2 className="font-noto text-2xl font-bold">NOTIFICATIONS</h2>
          </div>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[450px] p-4">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="font-noto text-xl">No upcoming notifications</p>
            </div>
          ) : (
            notifications.map(notification => {
              const colorScheme = getNotificationColor(notification.daysLeft);
              return (
                <div 
                  key={notification.id} 
                  className={`
                    ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text}
                    border rounded-lg p-4 mb-4 shadow-sm
                    transition-all hover:shadow-md
                  `}
                >
                  <div className="font-noto flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{notification.title}</h3>
                    <span className="text-sm font-medium">
                      {notification.daysLeft === 0 
                        ? 'Today' 
                        : `In ${notification.daysLeft} day${notification.daysLeft !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{notification.description}</p>
                  <div className="text-xs uppercase font-semibold">
                    {notification.type === 'assignment' ? 'Assignment' : 'Study Session'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;