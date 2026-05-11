from datetime import date
from decimal import Decimal
from typing import List, Optional
import io


def format_inr(amount: Decimal) -> str:
    """Format amount in Indian number system."""
    try:
        amount_int = int(amount)
        s = str(amount_int)
        if len(s) <= 3:
            return f"₹{s}"
        # Indian number system: last 3 digits, then groups of 2
        result = s[-3:]
        s = s[:-3]
        while s:
            result = s[-2:] + "," + result
            s = s[:-2]
        return f"₹{result}"
    except Exception:
        return f"₹{amount}"


def format_date(d: Optional[date]) -> str:
    if not d:
        return "N/A"
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{d.day:02d} {months[d.month-1]} {d.year}"


def generate_weekly_settlement_pdf(data: dict) -> bytes:
    """Generate weekly settlement PDF report."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; color: #1E293B; }}
            .header {{ text-align: center; border-bottom: 3px solid #F97316; padding-bottom: 15px; margin-bottom: 20px; }}
            .header h1 {{ color: #F97316; margin: 0; font-size: 28px; }}
            .header p {{ margin: 5px 0; color: #64748B; }}
            .section {{ margin-bottom: 20px; }}
            .section h2 {{ color: #1E293B; border-left: 4px solid #F97316; padding-left: 10px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th {{ background: #1E293B; color: white; padding: 10px; text-align: left; }}
            td {{ padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }}
            tr:nth-child(even) {{ background: #F8FAFC; }}
            .summary-card {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; }}
            .profit {{ color: #22C55E; font-weight: bold; font-size: 18px; }}
            .loss {{ color: #EF4444; font-weight: bold; font-size: 18px; }}
            .row {{ display: flex; justify-content: space-between; padding: 5px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #94A3B8; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏗️ PPT Builders</h1>
            <p>Site se settlement tak, sab ek jagah</p>
            <h2 style="color: #1E293B; margin-top: 10px;">{data.get('site_name', 'Site')} — Weekly Settlement</h2>
            <p>Week: {data.get('week_start', '')} to {data.get('week_end', '')}</p>
        </div>

        <div class="section">
            <h2>Work Done</h2>
            <table>
                <tr><th>Work Item</th><th>Quantity</th><th>Rate</th><th>Earned</th></tr>
                {''.join(f"<tr><td>{item['name']}</td><td>{item['quantity']} {item['unit']}</td><td>{format_inr(item['rate'])}</td><td>{format_inr(item['earned'])}</td></tr>" for item in data.get('work_items', []))}
                <tr style="font-weight: bold; background: #FFF7ED;">
                    <td colspan="3">Total Earned</td>
                    <td>{format_inr(data.get('total_earned', 0))}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>Expenses</h2>
            <table>
                <tr><th>Category</th><th>Description</th><th>Amount</th></tr>
                {''.join(f"<tr><td>{exp['category']}</td><td>{exp['description']}</td><td>{format_inr(exp['amount'])}</td></tr>" for exp in data.get('expenses', []))}
                <tr style="font-weight: bold; background: #FFF7ED;">
                    <td colspan="2">Total Expenses</td>
                    <td>{format_inr(data.get('total_expenses', 0))}</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>Labour Summary</h2>
            <div class="summary-card">
                <div class="row"><span>Total Labours:</span><span>{data.get('total_labours', 0)}</span></div>
                <div class="row"><span>Total Salary Paid:</span><span>{format_inr(data.get('total_salary', 0))}</span></div>
                <div class="row"><span>Advances Given:</span><span>{format_inr(data.get('total_advances', 0))}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>Financial Summary</h2>
            <div class="summary-card">
                <div class="row"><span>Total Earned:</span><span>{format_inr(data.get('total_earned', 0))}</span></div>
                <div class="row"><span>Labour Cost:</span><span>- {format_inr(data.get('total_salary', 0))}</span></div>
                <div class="row"><span>Expenses:</span><span>- {format_inr(data.get('total_expenses', 0))}</span></div>
                <hr/>
                <div class="row">
                    <span style="font-size: 16px; font-weight: bold;">Net Profit/Loss:</span>
                    <span class="{'profit' if data.get('net_profit', 0) >= 0 else 'loss'}">{format_inr(abs(data.get('net_profit', 0)))} {'▲' if data.get('net_profit', 0) >= 0 else '▼'}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by PPT Builders | {format_date(date.today())}</p>
        </div>
    </body>
    </html>
    """

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return pdf_bytes
    except Exception:
        # Return HTML as fallback if WeasyPrint not available
        return html.encode('utf-8')


def generate_labour_report_pdf(data: dict) -> bytes:
    """Generate labour payment report PDF."""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; color: #1E293B; }}
            .header {{ text-align: center; border-bottom: 3px solid #F97316; padding-bottom: 15px; margin-bottom: 20px; }}
            .header h1 {{ color: #F97316; margin: 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th {{ background: #1E293B; color: white; padding: 10px; text-align: left; }}
            td {{ padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }}
            .balance-card {{ background: #F0FDF4; border: 2px solid #22C55E; border-radius: 8px; padding: 15px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🏗️ PPT Builders</h1>
            <h2>Labour Payment Report</h2>
            <p>{data.get('labour_name', '')} | {data.get('period', '')}</p>
        </div>

        <h2>Attendance Summary</h2>
        <table>
            <tr><th>Month</th><th>Present</th><th>Half Day</th><th>Absent</th><th>Earned</th></tr>
            {''.join(f"<tr><td>{m['month']}</td><td>{m['present']}</td><td>{m['half_day']}</td><td>{m['absent']}</td><td>{format_inr(m['earned'])}</td></tr>" for m in data.get('monthly_summary', []))}
        </table>

        <h2>Payment History</h2>
        <table>
            <tr><th>Date</th><th>Type</th><th>Amount</th><th>Mode</th><th>Remarks</th></tr>
            {''.join(f"<tr><td>{p['date']}</td><td>{p['type']}</td><td>{format_inr(p['amount'])}</td><td>{p['mode']}</td><td>{p.get('remarks', '')}</td></tr>" for p in data.get('payments', []))}
        </table>

        <div class="balance-card">
            <h3>Balance Summary</h3>
            <p>Total Earned: {format_inr(data.get('total_earned', 0))}</p>
            <p>Total Paid: {format_inr(data.get('total_paid', 0))}</p>
            <p><strong>Balance Due: {format_inr(data.get('balance_due', 0))}</strong></p>
        </div>
    </body>
    </html>
    """
    try:
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except Exception:
        return html.encode('utf-8')
