import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './TurnosRecurrentes.css';

const TurnosRecurrentes = () => {
    const [turnosRec, setTurnosRec] = useState([]);
    
    useEffect(() => {
        const fetchTurnosRec = async () => {
            const reservasRef = collection(db, 'reservas');
            const querySnapshot = await getDocs(reservasRef);
            const turnos = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.isRecurrent) {
                    turnos.push({ id: doc.id, ...data });
                }
            });

            setTurnosRec(turnos);
        };

        fetchTurnosRec();
    }, []);

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'reservas', id));
            setTurnosRec(turnosRec.filter(turno => turno.id !== id));
            Swal.fire({
                title: 'Eliminado!',
                text: 'El turno recurrente ha sido eliminado.',
                icon: 'success',
            });
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'Hubo un error al eliminar el turno.',
                icon: 'error',
            });
        }
    };

    const handleEdit = (id) => {
        // Agregar lógica para editar los turnos recurrentes si es necesario
    };

    return (
        <div className="turnos-recurrentes">
            <h2>Turnos Recurrentes</h2>
            {turnosRec.length > 0 ? (
                <ul>
                    {turnosRec.map((turno) => (
                        <li key={turno.id}>
                            <div>
                                <span>{turno.nombre} {turno.apellido} - {turno.servicio} - {turno.fecha} a las {turno.hora}</span>
                                <button onClick={() => handleDelete(turno.id)}>Eliminar</button>
                                <button onClick={() => handleEdit(turno.id)}>Editar</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No hay turnos recurrentes.</p>
            )}
        </div>
    );
};

export default TurnosRecurrentes;
