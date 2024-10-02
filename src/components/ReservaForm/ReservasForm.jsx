// ReservasForm.jsx
import React, { useState } from 'react';
import { db } from '../../firebaseConfig'; // Asegúrate de que esto sea correcto
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ReservaForm.css'

const ReservasForm = () => {
    const [dni, setDni] = useState('');
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [servicio, setServicio] = useState('Corte pelo + barba');
    const [profesional, setProfesional] = useState('Matias');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [verificado, setVerificado] = useState(false);
    const [mostrarSolicitarCodigo, setMostrarSolicitarCodigo] = useState(false);
    const [whatsapp, setWhatsapp] = useState('');

    const navigate = useNavigate();

    const handleAgendar = async (e) => {
        e.preventDefault();
        try {
            // Verificar el usuario en la colección "usuarios"
            const docRef = doc(db, 'usuarios', dni);
            const docSnap = await getDoc(docRef);

            // Si el usuario existe
            if (docSnap.exists()) {
                const userData = docSnap.data();

                // Verificar el número de teléfono
                if (userData.telefono === telefono) {
                    setVerificado(true);
                    alert('Turno reservado exitosamente.');
                    navigate('/productos');
                } else {
                    // Número de teléfono incorrecto
                    alert('Número de teléfono incorrecto.');
                    setVerificado(false);
                    setMostrarSolicitarCodigo(true);
                    setWhatsapp(''); // Resetear Whatsapp para evitar mostrar un número incorrecto
                }
            } else {
                // Usuario no encontrado
                alert('Usuario no encontrado, por favor solicita un código.');
                setVerificado(false);
                setMostrarSolicitarCodigo(true);
                setWhatsapp(''); // Resetear Whatsapp para evitar mostrar un número incorrecto
            }
        } catch (error) {
            console.error('Error verificando usuario:', error);
        }
    };

    const handleSolicitarCodigo = async () => {
        if (whatsapp) {
            const whatsappUrl = `https://wa.me/${whatsapp}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`;
            window.open(whatsappUrl, '_blank');
        } else {
            // Obtener el número de WhatsApp del peluquero seleccionado
            try {
                const peluqueroDocRef = doc(db, 'peluqueros', profesional);
                const peluqueroDocSnap = await getDoc(peluqueroDocRef);

                if (peluqueroDocSnap.exists()) {
                    setWhatsapp(peluqueroDocSnap.data().whatsapp);
                    // Ahora intenta de nuevo abrir el WhatsApp
                    const whatsappUrl = `https://wa.me/${peluqueroDocSnap.data().whatsapp}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`;
                    window.open(whatsappUrl, '_blank');
                } else {
                    alert('No se encontró el número de WhatsApp del peluquero.');
                }
            } catch (error) {
                console.error('Error obteniendo el número de WhatsApp:', error);
            }
        }
    };
    

    return (
        <form onSubmit={handleAgendar}>
            <h2>Reservar Turno</h2>
            <div>
                <label>DNI</label>
                <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required />
            </div>
            <div>
                <label>Teléfono móvil</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>
            <div>
                <label>Nombre</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div>
                <label>Apellido</label>
                <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
            </div>
            <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
                <label>Servicio</label>
                <select value={servicio} onChange={(e) => setServicio(e.target.value)}>
                    <option value="Corte pelo + barba">Corte pelo + barba</option>
                    <option value="Corte solo">Corte solo</option>
                    <option value="Barba">Barba</option>
                    <option value="Lavado de cabello">Lavado de cabello</option>
                </select>
            </div>
            <div>
                <label>Profesional</label>
                <select value={profesional} onChange={(e) => setProfesional(e.target.value)}>
                    <option value="Matias">Matias</option>
                    <option value="Juan">Juan</option>
                    <option value="Sofia">Sofia</option>
                </select>
            </div>
            <div>
                <label>Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div>
                <label>Hora</label>
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
            <button type="submit">Agendar Turno</button>

            {!verificado && mostrarSolicitarCodigo && (
                <div>
                    <button type="button" onClick={handleSolicitarCodigo} className="btn-solicitar-codigo">
                        Solicitar Código
                    </button>
                </div>
            )}
        </form>
    );
};

export default ReservasForm;
