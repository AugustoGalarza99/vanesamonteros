import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './Calendario.css'; // Agrega estilos personalizados

const Calendario = ({ uidPeluquero }) => { // Recibe el uid del peluquero como prop
    const [turnos, setTurnos] = useState([]);
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const fetchTurnos = async () => {
            const turnosCollection = collection(db, 'reservas'); // Cambia a 'reservas'
            
            // Consulta las reservas solo del peluquero autenticado
            const q = query(turnosCollection, where('uidPeluquero', '==', uidPeluquero));
            const turnosSnapshot = await getDocs(q);
            const turnosList = turnosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTurnos(turnosList);
        };
        
        if (uidPeluquero) {
            fetchTurnos();
        }
    }, [uidPeluquero]);

    const handleTurnoClick = (turno) => {
        setSelectedTurno(turno);
        setShowOptions(true);
    };

    const handleDeleteTurno = async () => {
        if (selectedTurno) {
            await deleteDoc(doc(db, 'reservas', selectedTurno.id)); // Asegúrate de estar eliminando de la colección correcta
            setTurnos(turnos.filter(t => t.id !== selectedTurno.id));
            setShowOptions(false);
            setSelectedTurno(null);
            alert('Turno eliminado.');
        }
    };

    const handleChangeHorario = async (newHorario) => {
        if (selectedTurno) {
            await updateDoc(doc(db, 'reservas', selectedTurno.id), { horario: newHorario });
            setTurnos(turnos.map(t => t.id === selectedTurno.id ? { ...t, horario: newHorario } : t));
            setShowOptions(false);
            setSelectedTurno(null);
            alert('Horario cambiado.');
        }
    };

    const handleTurnoEnProceso = async () => {
        if (selectedTurno) {
            await updateDoc(doc(db, 'reservas', selectedTurno.id), { estado: 'En proceso' });
            setShowOptions(false);
            setSelectedTurno(null);
            alert('Turno marcado como en proceso.');
        }
    };

    return (
        <div className="calendario">
            <h2>Calendario de Turnos</h2>
            <div className="grid">
                {turnos.map(turno => (
                    <div key={turno.id} className={`turno ${turno.estado}`} onClick={() => handleTurnoClick(turno)}>
                        <p>{turno.nombre} {turno.apellido}</p>
                        <p>{turno.horario}</p>
                        <p>{turno.servicio}</p>
                    </div>
                ))}
            </div>
            {showOptions && (
                <div className="options">
                    <button onClick={handleDeleteTurno}>Eliminar Turno</button>
                    <button onClick={() => handleChangeHorario('nuevo horario')}>Cambiar Horario</button>
                    <button onClick={handleTurnoEnProceso}>Marcar como En Proceso</button>
                </div>
            )}
        </div>
    );
};

export default Calendario;
