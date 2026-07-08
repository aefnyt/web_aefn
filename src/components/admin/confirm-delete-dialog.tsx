"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

/**
 * Diálogo de confirmación de borrado reutilizable
 * ===========================================
 * Evita borrados accidentales pidiendo confirmación.
 * También maneja el estado de "borrando..." mientras se llama al backend.
 *
 * 📚 Concepto: Componente reutilizable
 * En vez de duplicar el diálogo de confirmación en cada módulo, lo creamos
 * una vez y lo usamos en profesores, noticias, eventos, etc. Si mañana
 * cambiamos el diseño del diálogo, solo modificamos este archivo.
 */

interface ConfirmDeleteDialogProps {
  /** True para mostrar el diálogo */
  open: boolean;
  /** Función que hace el borrado real (debe devolver {success, message}) */
  onConfirm: () => Promise<{ success: boolean; message: string }>;
  /** Se llama cuando se cierra el diálogo (cancelar o después de borrar) */
  onOpenChange: (open: boolean) => void;
  /** Título del diálogo */
  title: string;
  /** Descripción detallada */
  description: string;
  /** Texto del botón de confirmación */
  confirmText?: string;
  /** Elemento a borrar (para mostrarlo en la descripción) */
  itemLabel?: string;
  /** Callback opcional tras borrar exitosamente */
  onSuccess?: (message: string) => void;
  /** Callback opcional si el borrado falla */
  onError?: (message: string) => void;
}

export function ConfirmDeleteDialog({
  open,
  onConfirm,
  onOpenChange,
  title,
  description,
  confirmText = "Eliminar",
  itemLabel,
  onSuccess,
  onError,
}: ConfirmDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await onConfirm();
      if (result.success) {
        onSuccess?.(result.message);
        onOpenChange(false);
      } else {
        setError(result.message);
        onError?.(result.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
      onError?.(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => {
      if (!isDeleting) {
        setError(null);
        onOpenChange(o);
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {itemLabel && (
              <span className="block mt-2 font-semibold text-slate-700">
                {itemLabel}
              </span>
            )}
            <span className="block mt-2 text-xs">
              Esta acción generará un commit en GitHub. Podrás revertirlo desde el
              historial del repositorio si es necesario.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
