import pandas as pd  # Manipular dataframes
import io
import base64
import matplotlib.pyplot as plt
from wordcloud import WordCloud, STOPWORDS
import plotly.express as px
import dash
from dash import dcc, html, dash_table

# Leer el archivo CSV
df = pd.read_csv(r'C:\Users\User\Downloads\Legislacion\Legislacion\lista2.txt', sep=",")

# Convertir 'Likes' a numérico
df['Likes'] = pd.to_numeric(df['Likes'], errors='coerce')

# Convertir la columna 'Time' a formato de fecha
df['Time'] = pd.to_datetime(df['Time'], format='%d-%m-%Y', errors='coerce')

# Limpiar nombres de columnas (eliminar espacios/tabulaciones)
df.columns = df.columns.str.strip()

# Generar la nube de palabras
text = " ".join(comment for comment in df['Comment Text'].dropna())
stopwords = set(STOPWORDS)
stopwords.update(["de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las"])

wordcloud = WordCloud(stopwords=stopwords, background_color="white", width=800, height=400).generate(text)

# Guardar la imagen en un buffer para mostrarla en el dashboard
buffer = io.BytesIO()
plt.figure(figsize=(8, 8))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis('off')
plt.savefig(buffer, format="png")
buffer.seek(0)
image_base64 = base64.b64encode(buffer.getvalue()).decode()

# Calcular métricas
total_comentarios = df.shape[0]  # Total de comentarios
total_usuarios = df['User @'].nunique()  # Total de usuarios únicos

# Inicializar la aplicación Dash
app = dash.Dash(__name__)

# Gráfico de distribución de comentarios a lo largo del tiempo
fig_comments_time = px.histogram(df, x="Time", title="Distribución de Comentarios a lo Largo del Tiempo")

# Gráfico de distribución de likes
fig_likes = px.histogram(df, x="Likes", title="Distribución de Likes", nbins=50)

# Contar la cantidad de comentarios por usuario
df_user_comments = df['Nickname'].value_counts().reset_index()
df_user_comments.columns = ['Nickname', 'count']  # Renombrar columnas correctamente

# Crear el gráfico de barras
fig_comments_user = px.bar(df_user_comments, x='Nickname', y='count', title="Cantidad de Comentarios por Usuario")

# Obtener los 10 comentarios con más likes
top_likes_df = df[['Comment Text', 'Likes']].nlargest(10, 'Likes').sort_values(by='Likes', ascending=False)

# Obtener los 10 comentarios con más respuestas
top_replies_df = df[['Comment Text', 'Number of Replies']].nlargest(10, 'Number of Replies').sort_values(
    by='Number of Replies', ascending=False)

# Dashboard Layout con Tailwind CSS
app.layout = html.Div(className="bg-gray-100 p-8", children=[
    # Título
    html.H1("Análisis de Comentarios", className="text-4xl font-bold text-center text-blue-800 mb-8"),

    # Métricas principales
    html.Div(className="grid grid-cols-2 gap-4 mb-8", children=[
        html.Div(className="bg-white p-6 rounded-lg shadow-md text-center", children=[
            html.H3(f"Total de Comentarios: {total_comentarios}", className="text-2xl font-semibold text-blue-600")
        ]),
        html.Div(className="bg-white p-6 rounded-lg shadow-md text-center", children=[
            html.H3(f"Total de Usuarios Únicos: {total_usuarios}", className="text-2xl font-semibold text-green-600")
        ])
    ]),

    # Gráficos
    html.Div(className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8", children=[
        dcc.Graph(id='comments-time', figure=fig_comments_time, className="bg-white p-4 rounded-lg shadow-md"),
        dcc.Graph(id='likes-dist', figure=fig_likes, className="bg-white p-4 rounded-lg shadow-md")
    ]),

    # Gráfico de comentarios por usuario
    html.Div(className="mb-8", children=[
        dcc.Graph(id='comments-user', figure=fig_comments_user, className="bg-white p-4 rounded-lg shadow-md")
    ]),

    # Top Comentarios con Más Likes
html.Div(className="mb-8", children=[
    html.H2("Comentarios con Más Likes", className="text-3xl font-bold text-blue-800 mb-4"),
    html.Div(className="bg-white rounded-lg shadow-md", children=[
        dash_table.DataTable(
            columns=[{"name": col, "id": col} for col in top_likes_df.columns],
            data=top_likes_df.to_dict('records'),
            style_table={'overflowX': 'auto'},
            style_header={'backgroundColor': '#3b82f6', 'fontWeight': 'bold', 'color': 'white'},
            style_cell={'textAlign': 'left', 'padding': '10px'},
            style_data_conditional=[{'if': {'row_index': 'odd'}, 'backgroundColor': '#f3f4f6'}]
        )
    ])
]),

# Top Comentarios con Más Respuestas
html.Div(className="mb-8", children=[
    html.H2("Comentarios con Más Respuestas", className="text-3xl font-bold text-blue-800 mb-4"),
    html.Div(className="bg-white rounded-lg shadow-md", children=[
        dash_table.DataTable(
            columns=[{"name": col, "id": col} for col in top_replies_df.columns],
            data=top_replies_df.to_dict('records'),
            style_table={'overflowX': 'auto'},
            style_header={'backgroundColor': '#10b981', 'fontWeight': 'bold', 'color': 'white'},
            style_cell={'textAlign': 'left', 'padding': '10px'},
            style_data_conditional=[{'if': {'row_index': 'odd'}, 'backgroundColor': '#f3f4f6'}]
        )
    ])
]),

    # Nube de Palabras
    html.Div(className="mb-8", children=[
        html.H2("Nube de Palabras", className="text-3xl font-bold text-blue-800 mb-4"),
        html.Img(src=f'data:image/png;base64,{image_base64}', className="w-full md:w-3/4 mx-auto bg-white p-4 rounded-lg shadow-md")
    ])
])

# Ejecutar la aplicación
if __name__ == '__main__':
    app.run_server(debug=True)