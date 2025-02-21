import { db } from './firebaseConfig';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const limpiarReservasAntiguas = async () => {
    try {
        const reservasRef = collection(db, 'reservas');
        
        // Obtiene la fecha de un día atrás
        const hoy = new Date();
        const fechaLimite = new Date(hoy.setDate(hoy.getDate() - 2));

        // Primero obtenemos solo las reservas con estado "finalizado"
        const q = query(reservasRef, where("status", "==", "finalizado"));
        const snapshot = await getDocs(q);

        // Creamos un nuevo batch
        const batch = writeBatch(db);
        let tieneEliminaciones = false;

        // Filtramos manualmente las reservas con fecha menor a fechaLimite
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fecha < fechaLimite.toISOString().split('T')[0]) {
                batch.delete(doc.ref);
                tieneEliminaciones = true;
            }
        });

        // Solo ejecutamos el commit si hay eliminaciones
        if (tieneEliminaciones) {
            await batch.commit();
            //console.log('Reservas antiguas eliminadas.');
        } else {
            //console.log('No hay reservas antiguas para eliminar.');
        }
    } catch (error) {
        //console.error('Error al eliminar reservas antiguas:', error);
    }
};
