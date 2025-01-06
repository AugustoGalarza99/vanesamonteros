import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Ajusta la ruta según tu configuración
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SelectorProfesionales = ({ onReservasCargadas, onHorariosCargados }) => {
    const [profesionales, setProfesionales] = useState([]);
    const [uidPeluqueroSeleccionado, setUidPeluqueroSeleccionado] = useState(null);
    const [reservasLocales, setReservasLocales] = useState({});
    const [horariosLocales, setHorariosLocales] = useState({});
  
    // Cargar lista de peluqueros
    const fetchProfesionales = async () => {
      try {
        const profesionalesRef = collection(db, 'peluqueros');
        const querySnapshot = await getDocs(profesionalesRef);
  
        const profesionalesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProfesionales(profesionalesList);
      } catch (error) {
        console.error('Error obteniendo peluqueros:', error);
      }
    };
  
    // Cargar reservas del peluquero seleccionado
    const fetchReservasPeluquero = async (uidPeluquero) => {
      try {
        const reservasRef = collection(db, 'reservas');
        const q = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
        const querySnapshot = await getDocs(q);
  
        const reservasData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setReservasLocales((prev) => ({
          ...prev,
          [uidPeluquero]: reservasData,
        }));
  
        // Comunicar las reservas cargadas al componente padre
        if (onReservasCargadas) {
          onReservasCargadas(reservasData);
        }
      } catch (error) {
        console.error('Error obteniendo reservas:', error);
      }
    };
  
    // Cargar horarios de trabajo del peluquero seleccionado
    const fetchHorariosPeluquero = async (uidPeluquero) => {
      try {
        const horariosRef = collection(db, 'horarios');
        const horariosDoc = await getDocs(query(horariosRef, where('uidPeluquero', '==', uidPeluquero)));
  
        const horariosData = horariosDoc.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setHorariosLocales((prev) => ({
          ...prev,
          [uidPeluquero]: horariosData,
        }));
  
        // Comunicar los horarios cargados al componente padre
        if (onHorariosCargados) {
          onHorariosCargados(horariosData);
        }
      } catch (error) {
        console.error('Error obteniendo horarios:', error);
      }
    };
  
    // Manejar cambio de peluquero seleccionado
    const manejarCambioProfesional = (event) => {
      const uidSeleccionado = event.target.value;
      setUidPeluqueroSeleccionado(uidSeleccionado);
  
      // Cargar reservas y horarios locales o desde Firebase
      if (reservasLocales[uidSeleccionado]) {
        if (onReservasCargadas) {
          onReservasCargadas(reservasLocales[uidSeleccionado]);
        }
      } else {
        fetchReservasPeluquero(uidSeleccionado);
      }
  
      if (horariosLocales[uidSeleccionado]) {
        if (onHorariosCargados) {
          onHorariosCargados(horariosLocales[uidSeleccionado]);
        }
      } else {
        fetchHorariosPeluquero(uidSeleccionado);
      }
    };
  
    useEffect(() => {
      fetchProfesionales();
    }, []);
  
    return (
      <div className="selector-profesionales">
        <label htmlFor="profesionales">Selecciona un profesional:</label>
        <select
          id="profesionales"
          value={uidPeluqueroSeleccionado || ''}
          onChange={manejarCambioProfesional}
        >
          <option value="" disabled>Elige un profesional</option>
          {profesionales.map((profesional) => (
            <option key={profesional.id} value={profesional.id}>
              {profesional.nombre} {profesional.apellido}
            </option>
          ))}
        </select>
      </div>
    );
  };
  export default SelectorProfesionales;
