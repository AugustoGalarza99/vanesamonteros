import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebaseConfig"; // Asegúrate de importar auth
import { collection, getDocs, query, where, doc, setDoc, Timestamp } from "firebase/firestore";
import Swal from "sweetalert2";


const RegistroDemora = () => {
    const [profesional, setProfesional] = useState(null);
    const [demora, setDemora] = useState("");

    useEffect(() => {
        const fetchProfesional = async () => {
            const user = auth.currentUser; // Obtener usuario autenticado
            if (!user) return; // Si no hay usuario, salir de la función

            const q = query(collection(db, "peluqueros"), where("uid", "==", user.uid));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setProfesional({ id: snapshot.docs[0].id, ...data });
            }
        };

        fetchProfesional();
    }, []);

    const handleDemoraChange = (e) => {
        setDemora(e.target.value);
    };

    const saveDemora = async () => {
        try {
            const demoraValue = parseInt(demora, 10);
            if (isNaN(demoraValue)) return; // Validar valor numérico

            const docRef = doc(db, "demoras", profesional.id);
            const fechaActual = Timestamp.now();

            await setDoc(
                docRef,
                {
                    uid: profesional.id,
                    demora: demoraValue,
                    fecha: fechaActual,
                },
                { merge: true }
            );

            Swal.fire({
                title: "Demora registrada correctamente",
                text: "Recuerda que si tus turnos se acomodan, ingresa 0 como demora. Al finalizar el día, la demora volverá a 0 automáticamente.",
                icon: "success",
                background: "black",
                color: "white",
                confirmButtonText: "Ok",
            });
        } catch (error) {
            console.error("Error al guardar la demora:", error);
        }
    };

    return (
        <div className="demoras-container">
            <h2 className="demoras-title">Registro de demora</h2>
            {profesional ? (
                <table className="demoras-table">
                    <thead>
                        <tr>
                            <th>Profesional</th>
                            <th>Demora (minutos)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{profesional.nombre}</td>
                            <td>
                                <input
                                    type="number"
                                    className="demoras-input"
                                    value={demora}
                                    onChange={handleDemoraChange}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            ) : (
                <p>Cargando datos...</p>
            )}
            <button className="demoras-button" onClick={saveDemora} disabled={!profesional}>
                Guardar Demora
            </button>
        </div>
    );
};

export default RegistroDemora;
