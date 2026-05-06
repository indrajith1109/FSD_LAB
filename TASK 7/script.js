// Name Validation
function validateName() {
    let name = document.getElementById("name").value;
    let error = document.getElementById("nameError");

    if (name.length < 3) {
        error.innerHTML = "Name must be at least 3 characters";
    } else {
        error.innerHTML = "";
    }
}

// Email Validation
function validateEmail() {
    let email = document.getElementById("email").value;
    let error = document.getElementById("emailError");
    let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

    if (!email.match(pattern)) {
        error.innerHTML = "Enter valid email";
    } else {
        error.innerHTML = "";
    }
}

// Double Click Submit
function submitForm() {

    let nameError = document.getElementById("nameError").innerHTML;
    let emailError = document.getElementById("emailError").innerHTML;

    if (nameError === "" && emailError === "") {
        alert("Thank you! Your feedback has been submitted.");
    } else {
        alert("Please correct errors before submitting.");
    }
}