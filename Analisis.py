import pandas as pd #manipular dataframes
import openai
import os
import dotenv
import json
import numpy as np #para calculos
from wordcloud import WordCloud # nube de palabras
import matplotlib.pyplot as plt
import nltk
from nltk.corpus import stopwords #manipular texto
import unidecode #uniformizar tildez
import plotly.express as px #libreria grafica


df = pd.read_csv(r'C:\Users\sebas\Documents\Jurisprudencia\lista2.txt',sep=",")
# Imprimo las primas 5 lineas
print(df.head())
#convertimos like de String a numero
df['Likes'] = pd.to_numeric(df['Likes'])
#Cuales son los comentarios con mayor cantidad de likes
print(df[['Comment Text','Likes']].nlargest(10,'Likes').sort_values(by='Likes',ascending=False))

#nube de palabras
texto = ' '.join(df['Comment Text'])
texto.lower()
#Quitamos tildes
texto = unidecode.unidecode(texto)
print(texto)

#eliminamos las palabras que no aportan nada al nube como los conectores
nltk.download('stopwords')

#NUBE DE PALABRAS
nube = WordCloud(
    width = 800,
    height = 800,
    background_color='white',
    stopwords = set(stopwords.words('spanish')),
    min_font_size=10
).generate(texto)

plt.figure(figsize=(8,8))
plt.imshow(nube)
plt.axis('off')
plt.show()


gobierno =df[df['Comment Text'].str.contains('gobierno')]

alcalde= df[df['Comment Text'].str.contains('alcalde')]

culpa = df[df['Comment Text'].str.contains('culpa')]

acciones =df[df['Comment Text'].str.contains('acciones')]

print(gobierno)
print(alcalde)
print(culpa)
print(acciones)

