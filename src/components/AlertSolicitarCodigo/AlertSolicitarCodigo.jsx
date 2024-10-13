import React from 'react';
import Swal from 'sweetalert2'; // Importar SweetAlert2

const MyComponent = () => {

  const handleClick = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire(
          'Eliminado!',
          'El registro ha sido eliminado.',
          'success'
        )
      }
    });
  }

  return (
    <div>
      <button onClick={handleClick}>
        Eliminar registro
      </button>
    </div>
  );
}

export default MyComponent;
