import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Ajusta la ruta a tu configuración de Firebase
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import './EstadoDemoras.css';

const EstadoDemoras = () => {
    const [demoras, setDemoras] = useState([]); // Estado para almacenar las demoras
    const [isDataLoaded, setIsDataLoaded] = useState(false); // Controlar si los datos se cargaron inicialmente

    // Función para cargar datos desde Firestore
    const fetchDemoras = async () => {
        try {
            const snapshot = await getDocs(collection(db, "demoras"));
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDemoras(data);
            localStorage.setItem("demoras", JSON.stringify(data)); // Almacenar en localStorage
            setIsDataLoaded(true);
        } catch (error) {
            console.error("Error al obtener demoras:", error);
        }
    };

    // Verificar si hay cambios en Firestore y actualizar localStorage
    const subscribeToUpdates = () => {
        const unsubscribe = onSnapshot(
            collection(db, "demoras"),
            (snapshot) => {
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setDemoras(data);
                localStorage.setItem("demoras", JSON.stringify(data)); // Actualizar localStorage
            },
            (error) => console.error("Error al escuchar demoras:", error)
        );

        return unsubscribe;
    };

    useEffect(() => {
        // Cargar datos desde localStorage si están disponibles
        const cachedData = localStorage.getItem("demoras");
        if (cachedData) {
            setDemoras(JSON.parse(cachedData));
            setIsDataLoaded(true);
        } else {
            // Si no hay datos en caché, hacer la consulta inicial
            fetchDemoras();
        }

        // Suscribirse a cambios en Firestore
        const unsubscribe = subscribeToUpdates();

        return () => {
            unsubscribe(); // Limpiar listener al desmontar el componente
        };
    }, []);

    // Verificar si una fecha corresponde al día de hoy
    const isToday = (timestamp) => {
        if (!timestamp) return false;

        const fechaActual = new Date(); // Fecha actual
        const fechaDemora = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); // Convertir a Date

        return (
            fechaActual.getDate() === fechaDemora.getDate() &&
            fechaActual.getMonth() === fechaDemora.getMonth() &&
            fechaActual.getFullYear() === fechaDemora.getFullYear()
        );
    };

    // Obtener el estado de demora del profesional
    const getEstadoProfesional = (demora) => {
        if (isToday(demora.fecha)) {
            return `Demora de ${demora.demora} minutos`; // Si la fecha es de hoy
        }
        return "El profesional no tiene demoras"; // Si no hay demora para hoy
    };

    return (
        <div className="estado-demoras-container">
            <h2 className="estado-demoras-title">Estado de demoras</h2>
            {!isDataLoaded ? (
                <p>Cargando datos...</p>
            ) : (
                <table className="estado-demoras-table">
                    <thead>
                        <tr>
                            <th>Profesional</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demoras.length > 0 ? (
                            demoras.map((demora) => (
                                <tr key={demora.id}>
                                    <td>{demora.nombre || "Sin Nombre"}</td>
                                    <td>{getEstadoProfesional(demora)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="2">No hay información de demoras registrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default EstadoDemoras;
