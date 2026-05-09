import { pricingData } from "@/data/pricing";

export type AuditResult = {
    score: string,
    savings: number,
    recommendations: string[]
};

type ToolRow = {
    tool: string,
    plan: string,
    spend: string,
    seats: string,
};

export function runAudit(rows: ToolRow[]) {
    let savings = 0;
    let score = 100;

    const recommendations: string[] = [];

    rows.forEach((row) => {
        const spend = Number(row.spend);
        const seats = Number(row.seats);
        const tool = pricingData.find(
            (t) => t.tool === row.tool
        );


        if (!tool) {
            return;
        }
        const currentPlan = tool.plans.find(
            (p) => p.name === row.plan
        );

        if (!currentPlan) return;
        // Rule 1 
        if (row.plan === "Enterprice" && seats < 20) {
            savings += spend * 0.4;
            score -= 10;

            recommendations.push(
                `${row.tool}: downgrade from Enterprice plan`

            );

        }

        //Rule 2 
        if (row.plan === 'Team' && seats <= 2) {
            savings += spend * 0.25;
            score -= 8;

            recommendations.push(
                `${row.tool}: individual plans may be cheaper`
            )
        }

        //Rule 3
        if (spend > 300) {
            savings += spend * 0.15;
            score -= 5;

            recommendations.push(
                `${row.tool}: highly monthly spend detected`
            )
        }

        //Rule 4
        const cheaperPlans = tool.plans.filter(
            (p) =>
                p.price !== null &&
                currentPlan.price !==null &&
                p.price < currentPlan.price
        );
        if(cheaperPlans.length > 0 ){
            recommendations.push(
                `${row.tool}: cheaper plans available (${cheaperPlans[0].name})`
            )
        }
    });

    return {
        score: Math.max(score, 35),
        savings: Math.round(savings * 12),
        recommendations
    }

}