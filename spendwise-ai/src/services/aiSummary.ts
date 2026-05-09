import axios from "axios";

export async function generateAISummary(
  data: any
) {
  const prompt = `
You are an AI SaaS cost optimization assistant.

Analyze this AI spending audit.

Optimization Score: ${data.score}/100

Estimated Annual Savings: $${data.savings}

Recommendations:
${data.recommendations.join("\n")}

Write:
- concise professional summary
- 4 to 5 lines
- business tone
- mention optimization opportunities
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );

    console.log(
      "Gemini response:",
      response.data
    );

    return (
      response.data.candidates?.[0]
        ?.content?.parts?.[0]?.text ||
      "AI summary unavailable."
    );
  } catch (error: any) {
    console.error(
      "Gemini API Error:",
      error.response?.data || error
    );

    return `
Optimization score: ${data.score}/100.

Estimated annual savings: $${data.savings}.

SpendWise identified opportunities for AI cost optimization through plan right-sizing and reducing unnecessary spending.
`;
  }
}