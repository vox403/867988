(function(){
  const app = window.Voxtek;

  function start(){
    app.auth.updateLoginState();
    app.mail.updateUnread();
    app.windows.restoreSound();
    app.windows.bind();
    app.auth.bind();
    app.windows.sync();

    if (app.dom.employeeName) app.dom.employeeName.focus();
  }

  start();
})();
