import React from 'react';
import { Service } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Tag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-pink to-brand-purple rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-1000" />
      <Card className="glass overflow-hidden border-white/10 relative">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={service.imageUrl} 
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="px-2 py-1 rounded-md bg-brand-pink/20 backdrop-blur-md border border-brand-pink/30 text-brand-pink text-xs font-bold uppercase tracking-wider">
              {service.category === 'nails' ? 'Tırnak' : service.category === 'skin' ? 'Cilt Bakımı' : 'Masaj'}
            </span>
          </div>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-white group-hover:text-brand-pink transition-colors">
            {service.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-white/60 line-clamp-2">
            {service.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-brand-purple" />
              {service.duration} dk
            </div>
            <div className="flex items-center gap-1">
              <Tag className="w-4 h-4 text-brand-pink" />
              {service.price} TL
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => onBook(service)}
            className="w-full btn-gradient rounded-xl shadow-[0_0_20px_rgba(255,0,128,0.2)] hover:shadow-[0_0_30px_rgba(255,0,128,0.4)] transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Randevu Al
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
