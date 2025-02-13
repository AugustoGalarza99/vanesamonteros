import { db } from './firebaseConfig';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const limpiarReservasAntiguas = async () => {
    try {
        const reservasRef = collection(db, 'reservas');
        
        // Obtiene la fecha de tres días atrás
        const hoy = new Date();
        const fechaLimite = new Date(hoy.setDate(hoy.getDate() - 1));

        // Configura la consulta para obtener las reservas anteriores a tres días
        const q = query(
            reservasRef,
            where('fecha', '<', fechaLimite.toISOString().split('T')[0]),
            where("status", "==", "finalizado") // Solo eliminamos las finalizadas
        );
        const snapshot = await getDocs(q);

        const batch = writeBatch(db); // Crea el batch con writeBatch(db)
        
        // Añade cada reserva a eliminar al batch
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        // Ejecuta la eliminación en batch
        await batch.commit();
        console.log('Reservas anteriores a tres días eliminadas.');
    } catch (error) {
        console.error('Error al eliminar reservas antiguas:', error);
    }
};
