import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';

const statusConfigs = {
  pending: {
    color: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    label: 'Pending'
  },
  in_progress: {
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    icon: Clock,
    label: 'In Progress'
  },
  completed: {
    color: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    icon: CheckCircle,
    label: 'Completed'
  }
};

interface Assignment {
  id: string;
  title: string;
  date: string;
  description: string;
  status: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onStatusUpdate: (id: string, status: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onStatusUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState<string>(assignment.status);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  const StatusIcon = statusConfigs[currentStatus as keyof typeof statusConfigs].icon;
  
  const handleStatusClick = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newStatus = currentStatus === 'pending' ? 'in_progress' : 
                     currentStatus === 'in_progress' ? 'completed' : 'pending';
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ status: newStatus })
        .eq('id', assignment.id);
        
      if (error) throw error;
      
      setCurrentStatus(newStatus);
      onStatusUpdate(assignment.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const config = statusConfigs[currentStatus as keyof typeof statusConfigs];
  
  return (
    <div className={`flex items-center justify-between p-4 ${config.color} rounded-lg border ${config.borderColor} transition-all duration-200`}>
      <div className="flex-1">
        <h4 className="font-noto font-medium text-gray-800">{assignment.title}</h4>
        <p className="text-sm text-gray-500">{assignment.date}</p>
       {/*<p className="text-sm text-gray-600 mt-1">{assignment.description}</p> */}
      </div>
      <button
        onClick={handleStatusClick}
        disabled={isUpdating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.color} ${config.textColor} hover:opacity-80 transition-opacity`}
      >
        <StatusIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.label}</span>
      </button>
    </div>
  );
};

export default AssignmentCard;