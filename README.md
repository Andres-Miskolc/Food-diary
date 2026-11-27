# Food Diary

Web app to log daily meals, calculate calories and macronutrients, view weekly statistics, and estimate BMI.

## How to run
1. Open the folder in VS Code.
2. Install the **Live Server** extension and click "Go Live" (or just double-click `index.html`).

## Technologies
Plain HTML, CSS and JavaScript. Data is stored in the browser using localStorage.

## Calorie calculation
4 kcal/g for protein and carbohydrates, 9 kcal/g for fat.

## BMI
Enter weight in kilograms and height in centimeters in the Goals tab. The app estimates BMI using standard adult
ranges and saves the values in the browser alongside the other data.

## Nutrition planning
The Planning tab estimates daily energy needs with the Mifflin–St Jeor equation, an activity multiplier, and a
goal adjustment (+250 kcal for muscle gain, no adjustment for maintenance, and −500 kcal for weight loss). Macro
calories are divided among protein, fat, and carbohydrates according to the selected goal. The calculated targets
can be applied to Daily goals.
