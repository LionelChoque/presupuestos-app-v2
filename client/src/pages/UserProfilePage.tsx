import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User as UserIcon, Mail, Key, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthUser } from '@/hooks/use-auth';

// Definir esquemas para la validación de formularios
const profileFormSchema = z.object({
  nombre: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres',
  }).optional(),
  apellido: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres',
  }).optional(),
  email: z.string().email({
    message: 'Debe ingresar un correo electrónico válido',
  }).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: 'La contraseña actual debe tener al menos 6 caracteres',
  }),
  newPassword: z.string().min(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  }),
  confirmPassword: z.string().min(6, {
    message: 'La confirmación debe tener al menos 6 caracteres',
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('perfil');

  // Si no hay usuario, mostrar cargando
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return format(date, 'PPP', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta de información del usuario */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Tu información en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="text-xl">
                {user.nombre && user.apellido 
                  ? `${user.nombre[0]}${user.apellido[0]}`
                  : user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold">
                {user.nombre && user.apellido 
                  ? `${user.nombre} ${user.apellido}`
                  : user.username}
              </h2>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
            
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">Rol: <span className="font-semibold capitalize">{user.rol}</span></span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm break-all">{user.email || 'No registrado'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">Cuenta creada: {formatDate(user.fechaCreacion)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">Último acceso: {formatDate(user.ultimoAcceso)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs con formularios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <Tabs defaultValue="perfil" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="perfil">Editar Perfil</TabsTrigger>
                <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="perfil" className={activeTab === 'perfil' ? 'block' : 'hidden'}>
              <ProfileForm user={user} />
            </TabsContent>
            <TabsContent value="password" className={activeTab === 'password' ? 'block' : 'hidden'}>
              <PasswordForm user={user} />
            </TabsContent>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Tipos para el formulario de perfil
type ProfileFormValues = {
  nombre: string;
  apellido: string;
  email: string;
};

// Componente para editar la información de perfil
function ProfileForm({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
    }
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PATCH', `/api/users/${user.id}/profile`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido actualizada correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar',
        description: error.message || 'Ha ocurrido un error al actualizar tu perfil.',
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} />
              </FormControl>
              <FormDescription>
                Ingresa tu nombre para personalizar la experiencia
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="apellido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Tu apellido" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@ejemplo.com" {...field} />
              </FormControl>
              <FormDescription>
                Este correo se utilizará para notificaciones
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando</>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </form>
    </Form>
  );
}

// Tipos para el formulario de contraseña
type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
};

// Componente para cambiar contraseña
function PasswordForm({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });
  
  const changePasswordMutation = useMutation<unknown, Error, PasswordChangeRequest>({
    mutationFn: async (data: PasswordChangeRequest) => {
      const res = await apiRequest('POST', `/api/users/${user.id}/change-password`, data);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al cambiar contraseña',
        description: error.message || 'La contraseña actual es incorrecta o ha ocurrido un error.',
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>
                Debe tener al menos 6 caracteres
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando</>
          ) : (
            'Cambiar contraseña'
          )}
        </Button>
      </form>
    </Form>
  );
}