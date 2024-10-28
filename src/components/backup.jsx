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