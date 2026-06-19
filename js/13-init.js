    function initialize(){
      updateLoginState();
      bindContentsHub();
      vocBindPublicBoard();
      restoreSound();

      syncWindowLayerState();
      const saved = getStoredEmployee();
      if (saved){
        employeeNameInput.focus();
      } else {
        employeeNameInput.focus();
      }
    }

    initialize();
