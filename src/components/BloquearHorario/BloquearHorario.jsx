// BloquearHorario.jsx
import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const BloquearHorario = () => {
    const [horario, setHorario] = useState('');

    const handleBloquear = async () => {
        const nuevoBloqueo = {
            horario,
            estado: 'bloqueado',
        };

        await setDoc(doc(db, 'bloqueos', horario), nuevoBloqueo);
        alert('Horario bloqueado.');
    };

    return (
        <div>
            <h2>Bloquear Horario</h2>
            <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} required />
            <button onClick={handleBloquear}>Bloquear</button>
        </div>
    );
};

export default BloquearHorario;
