# app.py
from flask import Flask, render_template, request, jsonify, Response
import requests
import pandas as pd
import numpy as np
from io import StringIO
import csv
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
from dateutil.parser import parse as parse_date

app = Flask(__name__, static_folder='static', template_folder='templates')
MOCK_API = "https://68d424b8214be68f8c6887f1.mockapi.io/api/mozilla/tech/web/task/sales"

def fetch_remote_sales():
    """Fetch raw sales JSON from remote mock API and return as pandas DataFrame with correct dtypes."""
    resp = requests.get(MOCK_API, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if not data:
        return pd.DataFrame(columns=['sale_id','date','region','product','quantity','unit_price','total_price'])
    
    # Normalizing the data structure 
    normalized_data = []
    for record in data:
        normalized_record = {}
        
        if 'sale_id' in record:
            normalized_record['sale_id'] = str(record['sale_id'])
        elif 'id' in record:
            normalized_record['sale_id'] = str(record['id'])
        else:
            normalized_record['sale_id'] = 'unknown'
        
        # Handle date conversion
        date_val = record.get('date')
        if isinstance(date_val, (int, float)) and date_val > 1000000000:

            normalized_record['date'] = pd.to_datetime(date_val, unit='s')
        else:
            try:
                normalized_record['date'] = pd.to_datetime(date_val)
            except:
                normalized_record['date'] = pd.Timestamp.now()
        
        if 'region' in record:
            normalized_record['region'] = str(record['region'])
        elif 'reigon' in record:
            normalized_record['region'] = str(record['reigon'])
        else:
            normalized_record['region'] = 'Unknown'
        
        normalized_record['product'] = str(record.get('product', 'Unknown'))
        normalized_record['quantity'] = pd.to_numeric(record.get('quantity', 0), errors='coerce')
        normalized_record['unit_price'] = pd.to_numeric(record.get('unit_price', 0), errors='coerce')
        normalized_record['total_price'] = pd.to_numeric(record.get('total_price', 0), errors='coerce')
        
        normalized_data.append(normalized_record)
    
    df = pd.DataFrame(normalized_data)
    
    # Ensure proper data types
    df['quantity'] = df['quantity'].fillna(0).astype(int)
    df['unit_price'] = df['unit_price'].fillna(0.0)
    df['total_price'] = df['total_price'].fillna(0.0)
    
    # Sort by date and reset index
    df = df.sort_values('date').reset_index(drop=True)
    return df

def apply_filters_to_df(df, params):
    region = params.get('region')
    product = params.get('product')
    date_from = params.get('from')
    date_to = params.get('to')
    if region and region.lower() != 'all':
        df = df[df['region'] == region]
    if product and product.lower() != 'all':
        df = df[df['product'] == product]
    if date_from:
        try:
            df = df[df['date'] >= parse_date(date_from)]
        except Exception:
            pass
    if date_to:
        try:
            df = df[df['date'] <= parse_date(date_to)]
        except Exception:
            pass
    return df

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sales')
def api_sales():
    try:
        df = fetch_remote_sales()
        # convert date to ISO string
        out = df.copy()
        out['date'] = out['date'].dt.strftime('%Y-%m-%d')
        return jsonify(out.to_dict(orient='records'))
    except Exception as e:
        return jsonify({'error': str(e)}), 502

@app.route('/api/analytics')
def api_analytics():
    try:
        k_clusters = int(request.args.get('k', 3))
    except:
        k_clusters = 3

    try:
        df = fetch_remote_sales()
    except Exception as e:
        return jsonify({'error': 'failed to fetch remote data', 'details': str(e)}), 502

    metadata = {
        'regions': sorted(df['region'].dropna().unique().tolist()),
        'products': sorted(df['product'].dropna().unique().tolist())
    }

    # apply filters
    filtered = apply_filters_to_df(df, request.args)

    # KPIs
    total_revenue = float(filtered['total_price'].sum())
    total_quantity = int(filtered['quantity'].sum())

    # timeseries (daily revenue)
    if not filtered.empty:
        ts = filtered.groupby(filtered['date'].dt.strftime('%Y-%m-%d'))['total_price'].sum().rename('revenue').reset_index()
        ts_sorted = ts.sort_values('date')
        timeseries = ts_sorted.to_dict(orient='records')
    else:
        timeseries = []

    # region distribution
    if not filtered.empty:
        region_dist = filtered.groupby('region')['total_price'].sum().reset_index().rename(columns={'total_price':'revenue'})
        region_dist = region_dist.sort_values('revenue', ascending=False)
        region_distribution = region_dist.to_dict(orient='records')
    else:
        region_distribution = []

    # top 5 products by qty and revenue
    if not filtered.empty:
        prod_agg = filtered.groupby('product').agg({'quantity':'sum','total_price':'sum'}).reset_index()
        top_qty = prod_agg.sort_values('quantity', ascending=False).head(5)
        top_rev = prod_agg.sort_values('total_price', ascending=False).head(5)
        top_products_qty = top_qty[['product','quantity']].to_dict(orient='records')
        top_products_revenue = top_rev[['product','total_price']].rename(columns={'total_price':'revenue'}).to_dict(orient='records')
    else:
        top_products_qty = []
        top_products_revenue = []

    # Enhanced forecasting 
    forecast_days = int(request.args.get('forecast_days', 7))
    forecast = {'dates': [], 'values': [], 'ma': [], 'exponential_smooth': [], 'seasonal': []}
    
    if len(timeseries) >= 3:
        ts_df = pd.DataFrame(timeseries)
        ts_df['date'] = pd.to_datetime(ts_df['date'])
        ts_df = ts_df.sort_values('date').reset_index(drop=True)
        values = ts_df['revenue'].values.astype(float)
        dates = ts_df['date']
        
        ma_series = pd.Series(values).rolling(window=3, min_periods=1).mean()
        
        alpha = 0.3  # Smoothing factor
        exp_smooth = [values[0]]  # Initialize with first value
        for i in range(1, len(values)):
            exp_smooth.append(alpha * values[i] + (1 - alpha) * exp_smooth[i-1])
        
        # Linear Regression with trend
        X = np.arange(len(values)).reshape(-1, 1)
        y = values
        model = LinearRegression().fit(X, y)
        
        seasonal_pattern = []
        if len(values) >= 7:  
            # Calculate weekly averages
            weekly_avg = []
            for i in range(7):
                day_values = [values[j] for j in range(i, len(values), 7)]
                if day_values:
                    weekly_avg.append(np.mean(day_values))
                else:
                    weekly_avg.append(0)
            
            # Apply seasonal pattern
            for i in range(len(values)):
                seasonal_pattern.append(weekly_avg[i % 7])
        else:
            seasonal_pattern = [0] * len(values)
        
        # Generate forecasts
        future_X = np.arange(len(values), len(values) + forecast_days).reshape(-1, 1)
        linear_forecast = model.predict(future_X)
        
        exp_forecast = []
        last_exp = exp_smooth[-1]
        for i in range(forecast_days):
            exp_forecast.append(last_exp)
            last_exp = alpha * last_exp + (1 - alpha) * last_exp
        
        # Seasonal forecast
        seasonal_forecast = []
        for i in range(forecast_days):
            day_of_week = (len(values) + i) % 7
            if len(seasonal_pattern) > day_of_week:
                seasonal_forecast.append(seasonal_pattern[day_of_week])
            else:
                seasonal_forecast.append(0)
        
        # Combine all data
        all_dates = list(dates.dt.strftime('%Y-%m-%d')) + [
            (dates.iloc[-1] + pd.Timedelta(days=i+1)).strftime('%Y-%m-%d') 
            for i in range(forecast_days)
        ]
        
        all_values = list(values) + [float(x) for x in linear_forecast]
        all_ma = ma_series.tolist() + [None] * forecast_days
        all_exp_smooth = exp_smooth + [float(x) for x in exp_forecast]
        all_seasonal = seasonal_pattern + seasonal_forecast
        
        forecast = {
            'dates': all_dates,
            'values': [float(x) for x in all_values],
            'ma': [float(x) if x is not None else None for x in all_ma],
            'exponential_smooth': [float(x) for x in all_exp_smooth],
            'seasonal': [float(x) for x in all_seasonal]
        }

    # clustering 
    clusters_out = []
    cluster_centers = []
    cluster_stats = {}
    
    if not filtered.empty:
        prod = filtered.groupby('product').agg({
            'quantity': 'sum',
            'total_price': 'sum',
            'unit_price': 'mean',
            'date': 'count'  # Number of sales
        }).reset_index()
        
        # Normalize features for better clustering
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        
        # Features
        features = ['quantity', 'total_price', 'unit_price', 'date']
        X = prod[features].values.astype(float)
        X_scaled = scaler.fit_transform(X)
        
        # Determine optimal number of clusters
        k = max(2, min(k_clusters, len(prod)))
        
        if len(prod) >= k:
            # K-Means clustering
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = km.fit_predict(X_scaled)
            
            # Calculate cluster statistics
            cluster_centers = scaler.inverse_transform(km.cluster_centers_).tolist()
            
            for i in range(k):
                cluster_data = prod[labels == i]
                cluster_stats[f'cluster_{i}'] = {
                    'count': len(cluster_data),
                    'avg_quantity': float(cluster_data['quantity'].mean()),
                    'avg_revenue': float(cluster_data['total_price'].mean()),
                    'total_revenue': float(cluster_data['total_price'].sum()),
                    'products': cluster_data['product'].tolist()
                }
        else:
            labels = np.zeros(len(prod), dtype=int)
            cluster_centers = []
        
        prod['cluster'] = labels.astype(int).tolist()
        prod['sales_frequency'] = prod['date']  # Rename for clarity
        clusters_out = prod.rename(columns={'total_price': 'revenue', 'unit_price': 'avg_unit_price'}).to_dict(orient='records')

    # periodic comparison 
    pop_pct = 0.0
    if not filtered.empty:
        unique_dates = sorted(filtered['date'].dt.date.unique())
        if len(unique_dates) >= 2:
            last_date = pd.to_datetime(unique_dates[-1])
            last_end = last_date
            last_start = last_end - pd.Timedelta(days=29)  # last 30 days inclusive
            prev_end = last_start - pd.Timedelta(days=1)
            prev_start = prev_end - pd.Timedelta(days=29)
            cur_mask = (filtered['date'] >= last_start) & (filtered['date'] <= last_end)
            prev_mask = (filtered['date'] >= prev_start) & (filtered['date'] <= prev_end)
            cur_sum = filtered.loc[cur_mask, 'total_price'].sum()
            prev_sum = filtered.loc[prev_mask, 'total_price'].sum() or 0.000001
            pop_pct = float((cur_sum - prev_sum) / prev_sum * 100.0)

    # prepare response
    resp = {
        'kpis': {
            'total_revenue': float(total_revenue),
            'total_quantity': int(total_quantity)
        },
        'timeseries': timeseries,
        'region_distribution': region_distribution,
        'top_products_qty': top_products_qty,
        'top_products_revenue': top_products_revenue,
        'forecast': forecast,
        'clusters': clusters_out,
        'cluster_centers': cluster_centers,
        'cluster_stats': cluster_stats,
        'period_over_period_pct': float(pop_pct),
        'metadata': metadata
    }
    return jsonify(resp)

@app.route('/api/export.csv')
def api_export_csv():
    try:
        df = fetch_remote_sales()
    except Exception as e:
        return jsonify({'error': 'failed to fetch remote data', 'details': str(e)}), 502

    ids = request.args.get('ids')
    if ids:
        ids_set = set(ids.split(','))
        out_df = df[df['sale_id'].isin(ids_set)]
    else:
        out_df = apply_filters_to_df(df, request.args)

    out_df2 = out_df.copy()
    out_df2['date'] = out_df2['date'].dt.strftime('%Y-%m-%d')
    buf = StringIO()
    out_df2.to_csv(buf, index=False, columns=['sale_id','date','region','product','quantity','unit_price','total_price'])
    csv_str = buf.getvalue()
    return Response(csv_str, mimetype='text/csv', headers={"Content-disposition":"attachment; filename=sales_export.csv"})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 10000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
