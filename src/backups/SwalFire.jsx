Swal.fire({
    title: 'Reserva registrada',
    text: 'Tu reserva ha sido creada exitosamente, muchas gracias.',
    icon: 'success',
    background: 'black', 
    color: 'white', 
    confirmButtonText: 'Ok'
});

Swal.fire({
    title: 'No estás verificado',
    text: 'Debes verificar tu número de DNI y Telefono para agendar un turno. Solicita el codigo y cuando lo tengas pegalo en la parte inferior por unica vez. Si ya te verificaste por primera vez revisa tu DNI y telefono que hayan sido ingresados correctamente.',
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'Solicitar Código',
    cancelButtonText: 'Tengo el codigo',
    background: 'black', // Fondo rojo claro
    color: 'white', // Texto rojo oscuro
    customClass: {
        icon: 'custom-warning-icon', // Clase personalizada para el ícono de advertencia
}})

Swal.fire({
    title: 'Error al cancelar el turno',
    text: 'No puedes cancelar el turno porque faltan menos de 4 horas. Por favor, contacta a tu peluquero.',
    icon: 'error',
    background: 'black',
    color: 'white',
    confirmButtonText: 'Ok'
});

                                import Swal from 'sweetalert2';