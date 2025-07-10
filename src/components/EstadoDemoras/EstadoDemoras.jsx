import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import './EstadoDemoras.css';

const EstadoDemoras = () => {
    const [demoras, setDemoras] = useState([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [mostrar, setMostrar] = useState(false);

    // 🔍 Verifica si mostrar o no el componente desde config/demoras
    const verificarMostrarDemoras = async () => {
        try {
            const docRef = doc(db, "config", "demoras");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMostrar(!!docSnap.data().mostrar);
            }
        } catch (error) {
            console.error("Error verificando visibilidad de demoras:", error);
        }
    };

    // Carga las demoras por única vez
    const fetchDemoras = async () => {
        try {
            const snapshot = await getDocs(collection(db, "demoras"));
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDemoras(data);
            localStorage.setItem("demoras", JSON.stringify(data));
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Error al obtener demoras:", error);
        }
    };

    // Escucha en tiempo real cambios en la colección demoras
    const subscribeToUpdates = () => {
        const unsubscribe = onSnapshot(
            collection(db, "demoras"),
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setDemoras(data);
                localStorage.setItem("demoras", JSON.stringify(data));
            },
            (error) => console.error("Error al escuchar demoras:", error)
        );
        return unsubscribe;
    };

    useEffect(() => {
        verificarMostrarDemoras();

        const cachedData = localStorage.getItem("demoras");
        if (cachedData) {
            setDemoras(JSON.parse(cachedData));
            setIsDataLoaded(true);
        } else {
            fetchDemoras();
        }

        const unsubscribe = subscribeToUpdates();
        return () => unsubscribe();
    }, []);

    const isToday = (timestamp) => {
        if (!timestamp) return false;
        const fechaActual = new Date();
        const fechaDemora = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return (
            fechaActual.getDate() === fechaDemora.getDate() &&
            fechaActual.getMonth() === fechaDemora.getMonth() &&
            fechaActual.getFullYear() === fechaDemora.getFullYear()
        );
    };

    const getEstadoProfesional = (demora) => {
        if (isToday(demora.fecha)) {
            if (demora.demora === 0) {
                return "El profesional no tiene demora";
            }
            return `Demora de ${demora.demora} minutos`;
        }
        return "El profesional no tiene demora";
    };

    // 🚫 Oculta el componente si está desactivado desde Firestore
    if (!mostrar) return null;

    return (
        <div className="estado-demoras-container">
        {!isDataLoaded ? (
            <p className="estado-demoras-cargando">Cargando datos...</p>
        ) : (
            <div className="estado-demoras-grid">
                {demoras.length > 0 ? (
                    demoras.map((demora) => (
                        <div key={demora.id} className="demora-card-cliente">
                            <h3 className="h3-demora">{demora.nombre || "Sin Nombre"}</h3>
                            <p>{getEstadoProfesional(demora)}</p>
                        </div>
                    ))
                ) : (
                    <div className="demora-card">
                        <p>No hay información de demoras registrada.</p>
                    </div>
                )}
            </div>
        )}
    </div>
    );
};

export default EstadoDemoras;
