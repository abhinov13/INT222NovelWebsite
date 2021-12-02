var username_ = document.getElementById("username");
var password_ = document.getElementById("password");


username_.oninput = storeUsername;
password_.oninput = storePassword;

function storeUsername(e)
{
    localStorage.setItem('username',e.target.value);    
    return;
}
function storePassword(e)
{
    localStorage.setItem('password',e.target.value);
    return;
}
