const bcrypt = require("bcrypt");

(async () => {
    let enteredPassword = "1234"; // Your entered password
    let storedHash = "$2b$10$/jBSWp.eCZVk0"; // Your stored hash

    let isMatch = await bcrypt.compare(enteredPassword, storedHash);
    console.log("Does it match?:", isMatch);
})();
