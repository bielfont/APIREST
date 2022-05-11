function validateForm() {
    console.log('test')
    //alert(document.getElementById('name').value)
    //alert(document.forms['user_form']['name'].value)
    if (document.getElementById('name').value != '' &&
        document.getElementById('email').value != '' &&
        document.getElementById('password').value != '') {
            if (document.getElementById('password').value != document.getElementById('password2').value) {
                alert('No Coinciden')
                return false
            }

        return true
    }

    else {

        alert('Falta Rellenar')
        return false
    }



}