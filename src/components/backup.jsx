/*RESERVAFORM*/

const handleAgendar = async (e) => {
  e.preventDefault(); // Evitar el comportamiento predeterminado del formulario
  try {
      const clientesRef = collection(db, 'clientes'); // Referencia a la colección de clientes
      const q = query(clientesRef, where('dni', '==', dni)); // Buscar cliente por DNI
      const querySnapshot = await getDocs(q); // Obtener documentos que coinciden con la consulta

      if (!querySnapshot.empty) {
          for (const doc of querySnapshot.docs) {
              const userData = doc.data(); // Obtener datos del usuario
              if (userData.telefono === telefono && userData.verificado) {
                  setVerificado(true);

                  // Guardar la reserva en Firestore
                  try {
                      const reservasRef = collection(db, 'reservas'); // Referencia a la colección de reservas
                      
                      // Calcula el tiempo de fin
                      const startTime = new Date(`${fecha}T${hora}`);
                      const endTime = new Date(startTime.getTime() + duracionServicio * 60000); // Añade la duración

                      await addDoc(reservasRef, {
                          dni,
                          nombre,
                          apellido,
                          telefono,
                          servicio,
                          fecha,
                          hora,
                          duracion: duracionServicio, // Guarda la duración
                          horaFin: endTime.toISOString(), // Guarda la hora de fin
                          uidPeluquero: profesional, // Registrar el UID del peluquero seleccionado
                          status: 'Pendiente' // Establecer el estado de la reserva
                      });

                      Swal.fire({
                          title: 'Reserva registrada',
                          text: 'Tu reserva ha sido creada exitosamente, muchas gracias.',
                          icon: 'success',
                          background: 'black', 
                          color: 'white', 
                          confirmButtonText: 'Ok'
                      });
                      navigate('/estado'); // Redirigir al inicio o a otra página después de crear la reserva
                  } catch (error) {
                      console.error('Error al crear la reserva:', error);
                  }
              } else {
                  Swal.fire({
                      title: 'No estás verificado',
                      text: 'Debes verificar tu número de DNI y Telefono para agendar un turno.',
                      icon: 'error',
                      showCancelButton: true,
                      confirmButtonText: 'Solicitar Código',
                      cancelButtonText: 'Tengo el codigo',
                      background: 'black', // Fondo rojo claro
                      color: 'white', // Texto rojo oscuro
                      customClass: {
                          icon: 'custom-warning-icon', // Clase personalizada para el ícono de advertencia
                      }
                  }).then((result) => {
                      // Aquí es donde se maneja el evento "click" del botón de confirmación
                      if (result.isConfirmed) {
                          // Llamar a la función para solicitar el código
                          handleSolicitarCodigo();
                      } else if (result.isDismissed) {
                          console.log('El usuario canceló la solicitud de código');
                      }
                  });
                  setVerificado(false);
                  setMostrarSolicitarCodigo(true);
              }
          }
      } else {
          Swal.fire({
              title: 'No estás verificado',
              text: 'Debes verificar tu número de DNI y Telefono para agendar un turno. Solicita el codigo y cuando lo tengas pegalo en la parte inferior por unica vez.',
              icon: 'error',
              showCancelButton: true,
              confirmButtonText: 'Solicitar Código',
              cancelButtonText: 'Tengo el codigo',
              background: 'black', // Fondo rojo claro
              color: 'white', // Texto rojo oscuro
              customClass: {
                  icon: 'custom-warning-icon', // Clase personalizada para el ícono de advertencia
              }
          }).then((result) => {
              // Aquí es donde se maneja el evento "click" del botón de confirmación
              if (result.isConfirmed) {
                  // Llamar a la función para solicitar el código
                  handleSolicitarCodigo();
              } else if (result.isDismissed) {
                  console.log('El usuario canceló la solicitud de código');
              }
          });
          setVerificado(false);
          setMostrarSolicitarCodigo(true);
      }
  } catch (error) {
      console.error('Error verificando usuario:', error);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  await crearNuevaReserva(reserva);
  console.log('Reserva enviada');
};






const renderReservas = (diaFecha) => {
    const { gridHeight, totalMinutes, startHour } = calcularGridProperties();

    return reservas.map((reserva) => {
      const { hora, status, duracion } = reserva;
      const horaDate = new Date(`1970-01-01T${hora}:00`);
      const reservaFecha = new Date(reserva.fecha);

      const reservaFechaLocal = new Date(reservaFecha.getTime() + reservaFecha.getTimezoneOffset() * 60000);

      if (!isNaN(reservaFechaLocal) && !isNaN(horaDate)) {
        const esMismaFecha = isSameDay(reservaFechaLocal, diaFecha);

        if (esMismaFecha) {
          let estiloReserva = '';

          switch (status) {
            case 'Pendiente':
              estiloReserva = 'reserva-pendiente';
              break;
            case 'en proceso':
              estiloReserva = 'reserva-en-proceso';
              break;
            case 'finalizado':
              estiloReserva = 'reserva-finalizada';
              break;
            case 'cancelado':
              estiloReserva = 'reserva-cancelado';
              break;
            default:
              estiloReserva = '';
          }

          const totalReservaMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
          const topPosition = (totalReservaMinutes * (gridHeight / totalMinutes));
          const height = (duracion / 30) * 50;

          return (
            <div
              key={reserva.id}
              className={`reserva ${estiloReserva} ${modoVista === 1 ? 'vista-dia' : modoVista === 3 ? 'vista-tres' : 'vista-semana'}`}
              style={{
                position: 'absolute',
                left: '0',
                top: `${topPosition}px`,
                height: `${height}px`,
                zIndex: 1,
              }}
              onClick={() => manejarClickReserva(reserva)} 
            >
              <p className='text'>{`${reserva.nombre} ${reserva.apellido} - ${hora} - ${reserva.servicio} - ${reserva.status}`}</p>
            </div>
          )
        }
      }
      return null;
    });
  };





      // Obtener horarios disponibles del peluquero seleccionado y filtrar por solapamiento
      useEffect(() => {
        const fetchHorariosDisponibles = async () => {
            if (profesional && fecha) {
                try {
                    const peluqueroRef = doc(db, 'peluqueros', profesional);
                    const peluqueroDoc = await getDoc(peluqueroRef);
    
                    if (peluqueroDoc.exists()) {
                        const peluqueroData = peluqueroDoc.data();
                        const uidPeluquero = peluqueroData.uid;
    
                        const horariosRef = doc(db, 'horarios', uidPeluquero);
                        const horariosDoc = await getDoc(horariosRef);
    
                        if (horariosDoc.exists()) {
                            const horariosData = horariosDoc.data();
                            
                            // Asegurarse de que el formato sea correcto (ISO y UTC)
                            const selectedDate = new Date(`${fecha}T00:00:00Z`); // Fecha en UTC
                            const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                            const diaSeleccionado = selectedDate.getUTCDay(); // Día de la semana en UTC
                            const dia = diasSemana[diaSeleccionado]; // Mapeo al nombre del día en español    
                            const horariosDelDia = horariosData[dia];
    
                            if (horariosDelDia && horariosDelDia.isWorking) {
                                const availableSlots = [];
    
                                // Horarios de la mañana
                                const startHour1 = horariosDelDia.start1;
                                const endHour1 = horariosDelDia.end1;
                                let startTime = new Date(`1970-01-01T${startHour1}:00`);
                                let endTime = new Date(`1970-01-01T${endHour1}:00`);
    
                                while (startTime < endTime) {
                                    const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                    availableSlots.push(slotTime);
                                    startTime.setMinutes(startTime.getMinutes() + 30); // Incrementar 30 minutos
                                }
    
                                // Horarios de la tarde
                                const startHour2 = horariosDelDia.start2;
                                const endHour2 = horariosDelDia.end2;
                                startTime = new Date(`1970-01-01T${startHour2}:00`);
                                endTime = new Date(`1970-01-01T${endHour2}:00`);
    
                                while (startTime < endTime) {
                                    const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                    availableSlots.push(slotTime);
                                    startTime.setMinutes(startTime.getMinutes() + 30); // Incrementar 30 minutos
                                }
    
                                // Filtrar horarios ocupados y solapados
                                const reservasRef = collection(db, 'reservas');
                                const queryReservas = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', uidPeluquero));
                                const querySnapshot = await getDocs(queryReservas);
                                const ocupados = querySnapshot.docs.map(doc => {
                                    const data = doc.data();
                                    return { 
                                        start: new Date(`${fecha}T${data.hora}`), 
                                        end: new Date(new Date(`${fecha}T${data.hora}`).getTime() + data.duracion * 60000) 
                                    };
                                });
    
                                const horariosFiltrados = availableSlots.filter(slot => {
                                    const slotStartTime = new Date(`${fecha}T${slot}`);
                                    const slotEndTime = new Date(slotStartTime.getTime() + duracionServicio * 60000);
                                    
                                    // Verifica que no haya solapamiento
                                    return !ocupados.some(({ start, end }) => (
                                        (start < slotEndTime && end > slotStartTime) // Solapamiento
                                    ));
                                });
    
                                setHorariosDisponibles(horariosFiltrados);
                            } else {
                                setHorariosDisponibles([]); // Sin horarios disponibles
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error obteniendo horarios:', error);
                }
            }
        };
    
        fetchHorariosDisponibles();
    }, [profesional, fecha, duracionServicio]); // Dependencias para volver a ejecutar la consulta