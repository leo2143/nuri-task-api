import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/nuri-task-api";

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // Check users
  const user = await db.collection("users").findOne({ name: "leonardo" });
  console.log("Usuario leonardo:");
  console.log("  onboardingCompleted:", user.onboardingCompleted);
  console.log("  subscription.mercadoPagoId:", user.subscription?.mercadoPagoId);

  // Check todos
  const todo = await db.collection("todos").findOne({ title: "Aprender Node.js" });
  console.log("\nTodo:");
  console.log("  comments:", JSON.stringify(todo.comments));

  // Check goals
  const goal = await db.collection("goals").findOne({ title: "Dominar Node.js" });
  console.log("\nGoal:");
  console.log("  reason:", JSON.stringify(goal.reason));
  console.log("  parentGoalId:", goal.parentGoalId);

  await mongoose.disconnect();
}
check();
