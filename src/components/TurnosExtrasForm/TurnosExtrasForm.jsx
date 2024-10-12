import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'; // Importa el auth desde tu configuración de Firebase
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const TurnosExtraForm = () => {
    const [fecha, setFecha] = useState('');
    const [horaInicio, setHoraInicio] = useState('');
    const [turnosExistentes, setTurnosExistentes] = useState([]);
    const [profesionalId, setProfesionalId] = useState(null); // Aquí almacenaremos el uid del peluquero autenticado
    const duracionServicio = 120; // Por ejemplo, duración en minutos para el servicio

    // Verificar el usuario autenticado y obtener el uid del peluquero
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setProfesionalId(user.uid); // Almacenamos el UID del peluquero autenticado
            } else {
                console.error("Usuario no autenticado");
                setProfesionalId(null);
            }
        });

        return () => unsubscribe(); // Limpieza del listener
    }, []);

    // Obtener los turnos existentes para la fecha y el profesional autenticado
    useEffect(() => {
        const fetchTurnos = async () => {
            if (profesionalId && fecha) {
                const reservasRef = collection(db, 'reservas');
                const q = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', profesionalId));
                const querySnapshot = await getDocs(q);
                const turnos = querySnapshot.docs.map(doc => doc.data());
                setTurnosExistentes(turnos);
            }
        };

        fetchTurnos();
    }, [profesionalId, fecha]);

    const handleAgregarTurnoExtra = async (e) => {
        e.preventDefault();

        if (!profesionalId) {
            console.error('Error: El ID del profesional no está definido.');
            alert('Error: Por favor inicia sesión antes de agregar un turno extra.');
            return;
        }

        // Crear un objeto Date para hora de inicio
        const horaInicioExtra = new Date(`${fecha}T${horaInicio}`);
        const horaFinExtra = new Date(horaInicioExtra.getTime() + duracionServicio * 60000); // Calcula la hora de fin

        const haySolapamiento = turnosExistentes.some(turno => {
            const turnoInicio = new Date(`${turno.fecha}T${turno.hora}`);
            const turnoFin = new Date(turno.horaFin); // Asumiendo que 'horaFin' se guarda en la reserva existente
            return (
                (horaInicioExtra < turnoFin && horaFinExtra > turnoInicio)
            );
        });

        if (haySolapamiento) {
            alert('El horario extra que intentas agregar se solapa con otro turno existente.');
            return;
        }

        try {
            const turnosExtraRef = collection(db, 'turnosExtra');
            await addDoc(turnosExtraRef, {
                profesionalId,
                fecha,
                horaInicio: horaInicio, // Guarda solo la hora de inicio
                horaFin: horaFinExtra.toISOString() // Guarda la hora de fin calculada
            });
            alert('Turno extra agregado correctamente.');
        } catch (error) {
            console.error('Error agregando turno extra:', error);
        }
    };

    return (
        <div>
            <h2>Agregar Turno Extra</h2>
            <form onSubmit={handleAgregarTurnoExtra}>
                <div>
                    <label>Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Hora de inicio:</label>
                    <input
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        required
                    />
                </div>
                {/* Se ha eliminado la entrada para la hora de fin */}
                <button type="submit">Agregar Turno Extra</button>
            </form>
        </div>
    );
};

export default TurnosExtraForm;
