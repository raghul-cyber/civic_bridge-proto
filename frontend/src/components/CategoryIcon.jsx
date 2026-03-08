import React from 'react';
import * as LucideIcons from 'lucide-react';
import { CATEGORIES } from '../lib/constants';

const CategoryIcon = ({ categoryId, className = "w-5 h-5" }) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    const IconName = category?.icon || 'HelpCircle';
    const Icon = LucideIcons[IconName];

    return Icon ? <Icon className={className} /> : null;
};

export default CategoryIcon;
