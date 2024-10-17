const renderReservas = (diaFecha) => {
    const { gridHeight, totalMinutes, startHour } = calcularGridProperties();

    return reservas.map((reserva) => {
      const { hora, status, duracion } = reserva;
      const horaDate = new Date(`1970-01-01T${hora}:00`);
      const reservaFecha = new Date(reserva.fecha);

      if (!isNaN(reservaFecha) && !isNaN(horaDate)) {
        const esMismaFecha = isSameDay(reservaFecha, diaFecha);

        if (esMismaFecha) {
          let estiloReserva = '';

          // Estilo del evento según su estado
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
            default:
              estiloReserva = '';
          }

          // Cálculo de la posición y altura del evento
          const totalReservaMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
          const topPosition = (totalReservaMinutes * (gridHeight / totalMinutes));
          const height = (duracion / 30) * 51;

          return (
            <div
              key={reserva.id}
              className={`reserva ${estiloReserva}`}
              style={{
                position: 'absolute',
                left: '0',
                top: `${topPosition}px`,
                height: `${height}px`,
                zIndex: 1,
              }}
            >
              {`${reserva.nombre} - ${hora}`}
            </div>
          );
        }
      }
      return null;
    });
  };