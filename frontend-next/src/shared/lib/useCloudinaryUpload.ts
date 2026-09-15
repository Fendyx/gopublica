'use client';
import { useEffect, useRef, useState } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'menu_photos';

interface UseCloudinaryUploadOptions {
  onSuccess?: (url: string, resourceType?: string) => void;
  resourceType?: 'image' | 'video' | 'auto';
  multiple?: boolean;
}

export function useCloudinaryUpload({
  onSuccess,
  resourceType = 'auto',
  multiple = false,
}: UseCloudinaryUploadOptions = {}) {
  const widgetRef = useRef<any>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    const checkCloudinary = setInterval(() => {
      if ((window as any).cloudinary) {
        clearInterval(checkCloudinary);
        if (!widgetRef.current) {
          initWidget();
        }
      }
    }, 100);

    if (!document.getElementById('cloudinary-widget-script')) {
      const script = document.createElement('script');
      script.id = 'cloudinary-widget-script';
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => clearInterval(checkCloudinary);
  }, []);

  const initWidget = () => {
    if (!(window as any).cloudinary) return;
    const config: any = {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url', 'camera'],
      multiple,
      maxFileSize: 100000000, // 100MB for videos
      resourceType,
      language: 'ru',
    };

    widgetRef.current = (window as any).cloudinary.createUploadWidget(
      config,
      (error: any, result: any) => {
        if (result?.event === 'close') {
          setIsWidgetOpen(false);
        }
        if (!error && result?.event === 'success') {
          const uploadedUrl = result.info.secure_url;
          const uploadedResourceType = result.info.resource_type;
          onSuccess?.(uploadedUrl, uploadedResourceType);
        }
      },
    );
    setWidgetReady(true);
  };

  const openWidget = () => {
    if (widgetRef.current && widgetReady) {
      setIsWidgetOpen(true);
      widgetRef.current.open();
    } else {
      alert('Uploader is not ready yet.');
    }
  };

  return { openWidget, widgetReady, isWidgetOpen };
}
