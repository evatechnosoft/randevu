import React from 'react';
import { Service } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Tag, Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
  viewMode?: 'grid' | 'list';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook, viewMode = 'grid' }) => {
  const { t } = useLanguage();

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass group relative flex items-center gap-6 p-4 rounded-2xl border-white/5 hover:border-brand-pink/30 transition-all duration-500 overflow-hidden"
      >
        <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden">
          <img 
            src={service.imageUrl} 
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-brand-pink/10 text-brand-pink border border-brand-pink/20 px-2 py-0.5 rounded uppercase tracking-widest font-bold">
              {t(`cat.${service.category}`)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground truncate group-hover:text-brand-pink transition-colors">{service.name}</h3>
          <p className="text-foreground/50 text-xs line-clamp-1">{service.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-brand-pink font-bold text-lg">{service.price} TL</p>
            <p className="text-[10px] text-foreground/40 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3" /> {service.duration} dk
            </p>
          </div>
          <Button 
            onClick={() => onBook(service)}
            size="sm"
            className="btn-gradient rounded-lg px-4 h-8 text-xs"
          >
            {t('book.now')}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative group h-full"
    >
      <Card className="glass h-full overflow-hidden border-white/5 hover:border-brand-pink/20 transition-all duration-500 relative flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={service.imageUrl} 
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
          <div className="absolute bottom-4 left-4">
            <span className="px-2 py-1 rounded-md bg-brand-pink/20 backdrop-blur-md border border-brand-pink/30 text-brand-pink text-[10px] font-bold uppercase tracking-wider">
              {t(`cat.${service.category}`)}
            </span>
          </div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-foreground group-hover:text-brand-pink transition-colors">
            {service.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <p className="text-sm text-foreground/60 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-foreground/80">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-purple" />
              {service.duration} dk
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-pink" />
              {service.price} TL
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            onClick={() => onBook(service)}
            className="w-full btn-gradient rounded-xl shadow-lg shadow-brand-pink/10 hover:shadow-brand-pink/20 transition-all duration-300 py-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('book.now')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
