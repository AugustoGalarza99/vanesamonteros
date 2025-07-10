import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Ajusta la ruta a tu configuración de Firebase
import { collection, getDocs, doc, setDoc, Timestamp, updateDoc, getDoc } from "firebase/firestore";
import Swal from 'sweetalert2';
import './RegistroDemoraAdmin.css';

const RegistroDemoraAdmin = () => {
    const [profesionales, setProfesionales] = useState([]);
    const [demoras, setDemoras] = useState({});
    const [mostrarDemoras, setMostrarDemoras] = useState(false);

    useEffect(() => {
        const fetchProfesionales = async () => {
            const snapshot = await getDocs(collection(db, "peluqueros"));
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProfesionales(data);
        };
        
        const fetchConfiguracion = async () => {
        const docRef = doc(db, "config", "demoras");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setMostrarDemoras(docSnap.data().mostrar);
        }
        };        

        fetchProfesionales();
        fetchConfiguracion();
    }, []);

    const toggleMostrarDemoras = async () => {
        try {
            const docRef = doc(db, "config", "demoras");
            await updateDoc(docRef, { mostrar: !mostrarDemoras });
            setMostrarDemoras((prev) => !prev);
        } catch (error) {
            console.error("Error actualizando visibilidad:", error);
        }
    };

    const handleDemoraChange = (id, value) => {
        setDemoras((prevDemoras) => ({
            ...prevDemoras,
            [id]: value,
        }));
    };

    const saveDemoras = async () => {
        try {
            for (const id in demoras) {
                const demoraValue = parseInt(demoras[id], 10);
                if (isNaN(demoraValue)) {
                    continue; // Ignorar valores inválidos
                }

                const docRef = doc(db, "demoras", id);
                const fechaActual = Timestamp.now(); // Fecha actual como Timestamp de Firebase

                await setDoc(
                    docRef,
                    {
                        uid: id,
                        demora: demoraValue,
                        fecha: fechaActual,
                    },
                    { merge: true }
                );
            }
            Swal.fire({
                title: "Demora registrada correctamente",
                text: " Recuerda que si tus turnos se acomodan volver a ingresar el valor 0 como demora. Al finalizar el dia automaticamente la demora volvera a 0 ",
                icon: "success",
                background: "black",
                color: "white",
                confirmButtonText: "Ok",
            });
        } catch (error) {
            console.error("Error al guardar las demoras:", error);
        }
    };

return (
    <div className="demoras-container-admin">
        <h2 className="demoras-title-admin">Registro de demoras</h2>

        <div className="demoras-profesionales">
            {profesionales.map((prof) => (
                <div className="demora-card-admin" key={prof.id}>
                    <span className="demora-nombre">{prof.nombre}</span>
                    <input
                        type="number"
                        className="demora-input"
                        placeholder="Ej: 10"
                        value={demoras[prof.id] || ""}
                        onChange={(e) => handleDemoraChange(prof.id, e.target.value)}
                    />
                </div>
            ))}
        </div>

        <div className="mostrar-check">
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={mostrarDemoras}
                    onChange={toggleMostrarDemoras}
                />
                Mostrar estado de demoras en el sitio público
            </label>
        </div>

        <button className="demoras-button" onClick={saveDemoras}>
            Guardar Demoras
        </button>
    </div>
);

};

export default RegistroDemoraAdmin;
