'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { CATEGORIES, ProductType, ProductCondition, ProductStatus } from '@/lib/types';

interface ProductFormProps {
  initialData?: any;
  defaultDeliveryArea?: string;
  isEdit?: boolean;
}

export default function ProductForm({
  initialData,
  defaultDeliveryArea = 'Cartagena de Indias',
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();

  const [type, setType] = useState<ProductType>(initialData?.type || 'USED');
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Otros');
  const [categoriesList, setCategoriesList] = useState<string[]>([...CATEGORIES]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [condition, setCondition] = useState<ProductCondition>(initialData?.condition || 'GOOD');
  const [damageDetails, setDamageDetails] = useState(initialData?.damageDetails || '');
  const [priceCop, setPriceCop] = useState(initialData?.priceCop?.toString() || '');
  const [stock, setStock] = useState(initialData?.stock !== undefined ? initialData.stock.toString() : '1');
  const [productStatus, setProductStatus] = useState<ProductStatus>(initialData?.status || 'AVAILABLE');
  const [acceptsOffers, setAcceptsOffers] = useState(initialData?.acceptsOffers ?? false);
  const [deliveryArea, setDeliveryArea] = useState(initialData?.deliveryArea || defaultDeliveryArea);
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [allowWompiPayment, setAllowWompiPayment] = useState<boolean>(
    initialData?.allowWompiPayment !== undefined
      ? Boolean(initialData.allowWompiPayment)
      : (initialData?.type === 'DIGITAL' ? false : true)
  );
  const [images, setImages] = useState<Array<{ storagePath: string; altText?: string; previewUrl?: string }>>(
    initialData?.images?.map((img: any) => ({ storagePath: img.storagePath, altText: img.altText, previewUrl: img.storagePath })) || []
  );

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cargar categorías dinámicas configuradas en el administrador
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            setCategoriesList(data.categories);
          }
        }
      } catch {}
    }
    fetchCategories();
  }, []);

  // Función para comprimir en el navegador antes de enviar (para celular o conexiones lentas)
  const compressImageInBrowser = async (file: File): Promise<Blob | File> => {
    // Si no es imagen o el entorno no soporta canvas, enviar tal cual
    if (!file.type.startsWith('image/') || typeof window === 'undefined') {
      return file;
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    if (images.length + selectedFiles.length > 5) {
      alert(`Máximo 5 fotos por artículo. Ya tienes ${images.length} y seleccionaste ${selectedFiles.length}.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError('');

    try {
      let count = 0;
      for (const file of selectedFiles) {
        count++;
        setUploadProgress(`Procesando foto ${count} de ${selectedFiles.length}...`);

        const localBlobUrl = URL.createObjectURL(file);
        
        // Optimizar localmente antes de enviar para subida ultrarrápida
        const optimizedBlob = await compressImageInBrowser(file);
        const formData = new FormData();
        formData.append('file', optimizedBlob, file.name || `foto-${Date.now()}.jpg`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          if (res.ok && data.success) {
            setImages((prev) => [
              ...prev,
              {
                storagePath: data.url,
                previewUrl: localBlobUrl,
                altText: title || 'Foto de producto',
              },
            ]);
          } else {
            setError(data.error || 'Error subiendo la foto');
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            setError('Tiempo de espera agotado al subir la foto. Intenta con una imagen más liviana.');
          } else {
            setError('Error al conectar con el servidor de subidas');
          }
        }
      }
    } catch {
      setError('Error al procesar las fotografías');
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setVideoUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVideoUrl(data.url);
      } else {
        setError(data.error || 'Error al subir el video');
      }
    } catch {
      setError('Error al conectar con el servidor para subir video');
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (targetStatus: 'AVAILABLE' | 'DRAFT') => {
    setError('');

    if (!title.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (title.length > 90) {
      setError('El nombre no puede tener más de 90 caracteres');
      return;
    }

    if (type !== 'GIFT') {
      const parsed = parseInt(priceCop, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setError('Para artículos en venta o servicios, el precio debe ser mayor a 0');
        return;
      }
    }

    if (type === 'USED' && condition === 'DAMAGED' && (!damageDetails || damageDetails.trim().length < 5)) {
      setError('Si el artículo está dañado, debes detallar la falla obligatoriamente');
      return;
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError('El inventario debe ser 0 o un número positivo');
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      condition: type === 'USED' ? condition : null,
      damageDetails: type === 'USED' && condition === 'DAMAGED' ? damageDetails.trim() : null,
      priceCop: type === 'GIFT' ? null : parseInt(priceCop, 10),
      stock: parsedStock,
      acceptsOffers: type === 'GIFT' ? false : acceptsOffers,
      deliveryArea: deliveryArea.trim(),
      videoUrl: videoUrl.trim() || null,
      allowWompiPayment: type === 'DIGITAL' ? Boolean(allowWompiPayment) : true,
      status: parsedStock === 0 ? 'SOLD' : (isEdit ? productStatus : targetStatus),
      images: images.map((img) => ({
        storagePath: img.storagePath,
        altText: img.altText || title.trim(),
      })),
    };

    try {
      const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(resData.error || 'Error al guardar el producto');
        setSubmitting(false);
      }
    } catch {
      setError('Error de conexión al guardar');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <h1 className="text-xl font-black text-slate-900 truncate">
          {isEdit ? 'Editar Producto' : 'Publicar Nuevo'}
        </h1>
        <LogoutButton className="min-h-[38px] px-3 py-1.5 text-xs" label="Salir" />
      </div>

      {error && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm p-4 rounded-2xl font-bold">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* Selector Visual Grande */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Tipo de Publicación *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('NEW');
                if (deliveryArea.includes('Digital')) setDeliveryArea(defaultDeliveryArea);
              }}
              className={`min-h-[56px] rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center p-2 transition border-2 ${
                type === 'NEW'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">🆕</span>
              <span>NUEVO</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('USED');
                if (deliveryArea.includes('Digital')) setDeliveryArea(defaultDeliveryArea);
              }}
              className={`min-h-[56px] rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center p-2 transition border-2 ${
                type === 'USED'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">♻️</span>
              <span>USADO</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('DIGITAL');
                if (category === 'Otros') setCategory('Servicios Digitales');
                if (!deliveryArea || deliveryArea === 'Bogotá, Colombia') {
                  setDeliveryArea('Cartagena de Indias (y Digital / Remoto)');
                }
              }}
              className={`min-h-[56px] rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center p-2 transition border-2 ${
                type === 'DIGITAL'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">💻</span>
              <span>DIGITAL</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('GIFT');
                if (deliveryArea.includes('Digital')) setDeliveryArea(defaultDeliveryArea);
              }}
              className={`min-h-[56px] rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center p-2 transition border-2 ${
                type === 'GIFT'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">🎁</span>
              <span>REGALO</span>
            </button>
          </div>
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Fotografías ({images.length}/5)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-300">
                <SafeImage src={img.previewUrl || img.storagePath} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md"
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <>
                <label className="aspect-square rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 flex flex-col items-center justify-center cursor-pointer transition text-amber-700 p-2 text-center group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                  <span className="text-[11px] font-black mt-1 leading-tight">
                    {uploading ? '...' : 'Tomar Foto'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                <label className="aspect-square rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition text-blue-700 p-2 text-center group">
                  <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                  <span className="text-[11px] font-black mt-1 leading-tight">
                    {uploading ? '...' : 'Galería'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {uploading && (
            <div className="flex items-center gap-2 p-2.5 my-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold animate-pulse">
              <span className="animate-spin text-sm">⏳</span>
              <span>{uploadProgress || 'Procesando y subiendo fotos de alta velocidad...'}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Puedes tomar fotos directas con tu cámara 📸 o elegir varias desde tu galería 📁. Se optimizan automáticamente al instante.
          </p>
        </div>

        {/* Video Corto del Producto */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Video Corto del Producto (Opcional)
          </label>
          {videoUrl ? (
            <div className="bg-slate-900 rounded-xl p-3 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center space-x-2 text-xs truncate">
                <span className="text-lg">🎥</span>
                <span className="font-bold text-yellow-300">Video adjunto:</span>
                <span className="truncate opacity-80">{videoUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => setVideoUrl('')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shrink-0"
              >
                ✕ Quitar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="min-h-[46px] px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer flex items-center justify-center space-x-2 text-xs font-bold text-slate-700 transition">
                <span>🎥</span>
                <span>{videoUploading ? 'Subiendo video...' : 'Subir video corto (MP4/WebM)'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoUpload}
                  disabled={videoUploading}
                  className="hidden"
                />
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="O pega link de YouTube / MP4..."
                className="min-h-[46px] px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-medium"
              />
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Sube un video corto (máx 35 MB) o pega un enlace de YouTube o video web. Aparecerá en la galería del producto.
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Nombre del artículo * (máx 90 caracteres)
          </label>
          <input
            type="text"
            required
            maxLength={90}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Bicicleta de Montaña Rin 29"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-semibold text-slate-900"
          />
          <span className="text-xs text-slate-400 float-right mt-1">{title.length}/90</span>
        </div>

        {/* Categoría e Inventario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Categoría *
              </label>
              <Link
                href="/admin/ajustes#categorias"
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                + Editar Categorías
              </Link>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 bg-white focus:border-green-600 font-medium text-slate-900"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Inventario Disponible (Unidades) *
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="1"
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Si es 0, no se podrá comprar por Wompi.</p>
          </div>
        </div>

        {/* Condición si es USADO */}
        {type === 'USED' && (
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-blue-900">
              Condición del artículo usado *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCondition('GOOD')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  condition === 'GOOD'
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Funciona bien
              </button>
              <button
                type="button"
                onClick={() => setCondition('DETAILS')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  condition === 'DETAILS'
                    ? 'bg-sky-600 text-white border-sky-700'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Tiene detalles
              </button>
              <button
                type="button"
                onClick={() => setCondition('DAMAGED')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  condition === 'DAMAGED'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ⚠️ Está dañado
              </button>
            </div>

            {condition === 'DAMAGED' && (
              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-wider text-rose-800 mb-1">
                  Descripción obligatoria de la falla *
                </label>
                <textarea
                  required
                  rows={2}
                  value={damageDetails}
                  onChange={(e) => setDamageDetails(e.target.value)}
                  placeholder="Explica con total transparencia qué parte no funciona o qué daño tiene..."
                  className="w-full p-3 rounded-xl border border-rose-300 focus:border-rose-600 text-sm text-slate-900 bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Configuración especial para PRODUCTOS DIGITALES / SERVICIOS */}
        {type === 'DIGITAL' && (
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-900 font-black text-sm">
              <span>💻</span>
              <span>Producto Digital o Servicio</span>
            </div>
            <label className="flex items-start space-x-3 cursor-pointer select-none bg-white p-3 rounded-xl border border-indigo-200">
              <input
                type="checkbox"
                checked={allowWompiPayment}
                onChange={(e) => setAllowWompiPayment(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded-sm focus:ring-indigo-500 mt-0.5 shrink-0"
              />
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  Permitir botón de pago directo con Wompi
                </span>
                <span className="text-xs text-slate-600 leading-tight block mt-0.5">
                  {allowWompiPayment
                    ? '✓ El cliente podrá pagar de inmediato online con Wompi.'
                    : '✕ Recomendado por defecto: El cliente te contactará primero a WhatsApp para cotizar y acordar los detalles antes de pagar.'}
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Precio en COP */}
        {type !== 'GIFT' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                {type === 'DIGITAL' ? 'Precio o Tarifa Base en COP *' : 'Precio en Pesos Colombianos (COP) *'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-bold text-slate-500">$</span>
                <input
                  type="number"
                  required
                  min={100}
                  step={100}
                  value={priceCop}
                  onChange={(e) => setPriceCop(e.target.value)}
                  placeholder="50000"
                  className="w-full min-h-[48px] pl-8 pr-4 rounded-xl border border-slate-300 focus:border-green-600 font-bold text-slate-900 text-lg"
                />
              </div>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer select-none bg-slate-50 p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={acceptsOffers}
                onChange={(e) => setAcceptsOffers(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded-sm focus:ring-green-500"
              />
              <span className="text-sm font-bold text-slate-800">
                Acepto ofertas o tarifas personalizadas para este servicio
              </span>
            </label>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 text-sm font-bold flex items-center space-x-2">
            <span>🎁</span>
            <span>Este artículo es un REGALO: se publicará como 100 % GRATIS y no admitirá cobros.</span>
          </div>
        )}

        {/* Zona de entrega */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Ciudad o Zona General de Entrega
          </label>
          <input
            type="text"
            value={deliveryArea}
            onChange={(e) => setDeliveryArea(e.target.value)}
            placeholder="Ej. Cartagena de Indias o Entrega Digital / Remoto"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 focus:border-green-600 font-medium text-slate-900 text-sm"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Descripción corta
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qué incluye, estado de funcionamiento, motivo de venta o detalles de interés..."
            className="w-full p-3 rounded-xl border border-slate-300 focus:border-green-600 text-sm font-medium text-slate-900"
          />
        </div>

        {/* Selector de estado en edición */}
        {isEdit && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Estado de la Publicación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProductStatus('AVAILABLE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  productStatus === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                DISPONIBLE
              </button>
              <button
                type="button"
                onClick={() => setProductStatus('RESERVED')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  productStatus === 'RESERVED'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                RESERVADO
              </button>
              <button
                type="button"
                onClick={() => setProductStatus('SOLD')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  productStatus === 'SOLD'
                    ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                VENDIDO
              </button>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('DRAFT')}
            className="w-full sm:w-1/2 min-h-[56px] rounded-2xl border-2 border-slate-300 hover:border-slate-400 bg-white text-slate-800 font-bold text-base transition active:scale-[0.98] disabled:opacity-50"
          >
            GUARDAR BORRADOR
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('AVAILABLE')}
            className="w-full sm:w-1/2 min-h-[56px] rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-md transition active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'PUBLICAR'}
          </button>
        </div>
      </form>
    </div>
  );
}
