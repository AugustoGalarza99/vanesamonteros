import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './RecomendacionesClientes.css';

const RecomendacionesCliente = () => {
    const [recomendaciones, setRecomendaciones] = useState([]);

    const fetchActivas = async () => {
        const q = query(
            collection(db, 'recomendaciones'),
            where('activo', '==', true),
            orderBy('orden') // ✅ importante para mantener el orden establecido
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecomendaciones(data);
    };

    useEffect(() => {
        fetchActivas();
    }, []);

    if (recomendaciones.length === 0) return null;

    return (
        <div className="recomendaciones-cliente">
            <h2>Recomendados de la semana</h2>
            <div className="reco-grid">
                {recomendaciones.map((r) => (
                    <div className="reco-card" key={r.id}>                        
                        {r.imagen && <img src={r.imagen} alt={r.titulo} />}
                        <h3>{r.titulo}</h3>                      
                        <p>{r.descripcion}</p>
                        <strong>${r.precio}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecomendacionesCliente;
