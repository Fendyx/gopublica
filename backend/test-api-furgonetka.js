async function testFurgonetkaAPI() {
    // 1. Получаем токен (то, что у тебя уже сработало)
    const tokenUrl = "https://api.sandbox.furgonetka.pl/oauth/token";
    const params = new URLSearchParams();
    params.append("grant_type", "password");
    params.append("scope", "api");
    params.append("username", "gopublica.com@gmail.com");
    params.append("password", "4728Andrey!"); // Твой пароль

    try {
        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Authorization": "Basic bXlzYWFzdGVzdC1jNjRkN2UyMmQ5ZGZmYTVjMDc5OGU4MjcxODZmY2U1Zjo1NTg1YTE3YWEzMmJlYjVmNTNjMGI3ODE5ZjU4NmY2YmU4MzM2NDI0MTg2ZjA2YjRlNjU1YTljMDQzZDc5N2I4",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        console.log("✅ Токен успешно получен!");

        // 2. Делаем запрос к API с этим токеном
        console.log("⏳ Запрашиваем список курьеров...");
        const servicesUrl = "https://api.sandbox.furgonetka.pl/api/rest/services";
        
        const servicesResponse = await fetch(servicesUrl, {
            method: "GET",
            headers: {
                // Вот тут мы используем наш access_token
                "Authorization": `Bearer ${accessToken}`, 
                "Accept": "application/json"
            }
        });

        if (!servicesResponse.ok) {
            throw new Error(`Ошибка API: ${servicesResponse.status}`);
        }

        const servicesData = await servicesResponse.json();
        
        // Выводим результат в консоль
        console.log("✅ Доступные службы доставки:");
        // Пройдемся по массиву и выведем только названия для красоты
        servicesData.forEach(service => {
            console.log(`- ${service.name} (ID: ${service.service_id})`);
        });

    } catch (error) {
        console.error("❌ Произошла ошибка:", error);
    }
}

testFurgonetkaAPI();