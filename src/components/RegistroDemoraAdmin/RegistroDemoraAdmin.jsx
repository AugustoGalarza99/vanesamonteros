import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Ajusta la ruta a tu configuración de Firebase
import { collection, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
import Swal from 'sweetalert2';
import './RegistroDemoraAdmin.css';

const RegistroDemoraAdmin = () => {
    const [profesionales, setProfesionales] = useState([]);
    const [demoras, setDemoras] = useState({});

    useEffect(() => {
        const fetchProfesionales = async () => {
            const snapshot = await getDocs(collection(db, "peluqueros"));
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProfesionales(data);
        };
        fetchProfesionales();
    }, []);

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
        <div className="demoras-container">
            <h2 className="demoras-title">Registro de demoras</h2>
            <table className="demoras-table">
                <thead>
                    <tr>
                        <th>Profesional</th>
                        <th>Demora (minutos)</th>
                    </tr>
                </thead>
                <tbody>
                    {profesionales.map((prof) => (
                        <tr key={prof.id}>
                            <td>{prof.nombre}</td>
                            <td>
                                <input
                                    type="number"
                                    className="demoras-input"
                                    value={demoras[prof.id] || ""}
                                    onChange={(e) =>
                                        handleDemoraChange(prof.id, e.target.value)
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="demoras-button" onClick={saveDemoras}>
                Guardar Demoras
            </button>
        </div>
    );
};

export default RegistroDemoraAdmin;
