'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CATEGORIES, ProductType, ProductCondition } from '@/lib/types';

interface ProductFormProps {
  initialData?: any;
  defaultDeliveryArea?: string;
  isEdit?: boolean;
}

export default function ProductForm({
  initialData,
  defaultDeliveryArea = 'Bogotá, Colombia',
  isEdit = false,
}: ProductFormProps) {
  const router = useRouter();

  const [type, setType] = useState<ProductType>(initialData?.type || 'USED');
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Otros');
  const [description, setDescription] = useState(initialData?.description || '');
  const [condition, setCondition] = useState<ProductCondition>(initialData?.condition || 'GOOD');
  const [damageDetails, setDamageDetails] = useState(initialData?.damageDetails || '');
  const [priceCop, setPriceCop] = useState(initialData?.priceCop?.toString() || '');
  const [stock, setStock] = useState(initialData?.stock !== undefined ? initialData.stock.toString() : '1');
  const [acceptsOffers, setAcceptsOffers] = useState(initialData?.acceptsOffers ?? false);
  const [deliveryArea, setDeliveryArea] = useState(initialData?.deliveryArea || defaultDeliveryArea);
  const [images, setImages] = useState<Array<{ storagePath: string; altText?: string }>>(
    initialData?.images?.map((img: any) => ({ storagePath: img.storagePath, altText: img.altText })) || []
  );

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (images.length + e.target.files.length > 5) {
      alert('Máximo 5 fotos por artículo');
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of Array.from(e.target.files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setImages((prev) => [...prev, { storagePath: data.url, altText: title || 'Foto de producto' }]);
        } else {
          setError(data.error || 'Error subiendo la foto');
        }
      }
    } catch {
      setError('Error al conectar con el servidor de subidas');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
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
        setError('Para artículos en venta, el precio debe ser mayor a 0');
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
      status: parsedStock === 0 && targetStatus === 'AVAILABLE' ? 'SOLD' : targetStatus,
      images,
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
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-1 text-sm font-bold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-300 transition"
        >
          <span>←</span>
          <span>VOLVER</span>
        </Link>
        <h1 className="text-xl font-black text-slate-900">
          {isEdit ? 'Editar Producto' : 'Publicar Nuevo Producto'}
        </h1>
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('NEW')}
              className={`min-h-[56px] rounded-2xl font-black text-base flex flex-col items-center justify-center p-2 transition border-2 ${
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
              onClick={() => setType('USED')}
              className={`min-h-[56px] rounded-2xl font-black text-base flex flex-col items-center justify-center p-2 transition border-2 ${
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
              onClick={() => setType('GIFT')}
              className={`min-h-[56px] rounded-2xl font-black text-base flex flex-col items-center justify-center p-2 transition border-2 ${
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
                <img src={img.storagePath} alt="" className="w-full h-full object-cover" />
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
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-green-600 bg-slate-50 hover:bg-green-50 flex flex-col items-center justify-center cursor-pointer transition text-slate-500 hover:text-green-700 p-2 text-center">
                <span className="text-2xl">📸</span>
                <span className="text-xs font-bold mt-1">
                  {uploading ? 'Subiendo...' : '+ Foto'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Carga fotos desde tu cámara o galería. Se optimizan automáticamente con Sharp.
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-xl border border-slate-300 bg-white focus:border-green-600 font-medium text-slate-900"
            >
              {CATEGORIES.map((cat) => (
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

        {/* Precio en COP */}
        {type !== 'GIFT' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Precio en Pesos Colombianos (COP) *
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
                Acepto ofertas razonables para este artículo
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
            placeholder="Ej. Bogotá (Zona Norte) o entrega a coordinar"
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
