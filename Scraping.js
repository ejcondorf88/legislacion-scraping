// Configuración de las XPaths por red social
const socialNetwork = "instagram"; // Cambia esto a "twitter" o "facebook" si es necesario

// XPaths para Instagram
const instagramXPaths = {
    commentsDivXPath: '//div[contains(@class, "C7I1f") and contains(@class, "Y8WcF")]',
    allCommentsXPath: '//ul[contains(@class, "Mr508")]/li',
    level2CommentsXPath: '//div[contains(@class, "C7I1f") and contains(@class, "k9GMp")]',
    publisherProfileUrlXPath: '//a[contains(@class, "FPmhX")]/@href',
    nicknameAndTimePublishedAgoXPath: '//time[contains(@class, "EH8I4")]/@datetime',
    likesCommentsSharesXPath: "//button[contains(@class, 'dCJp8')]",
    postUrlXPath: '//a[contains(@class, "yWX7d")]/@href',
    descriptionXPath: '//span[contains(@class, "Jv7Aj")]/span',
    viewMoreDivXPath: '//button[contains(@class, "v6J5p") and contains(., "Ver más")]',
};

// XPaths para Twitter
const twitterXPaths = {
    commentsDivXPath: '//article[contains(@class, "css-1dbjc4n")]',
    allCommentsXPath: '//div[contains(@class, "css-1dbjc4n")]//div[contains(@class, "css-1g9t6lq")]',
    level2CommentsXPath: '//div[contains(@class, "css-1dbjc4n")]//div[contains(@class, "css-1b5y7j3")]',
    publisherProfileUrlXPath: '//a[contains(@href, "/profile")]/@href',
    nicknameAndTimePublishedAgoXPath: '//time[contains(@class, "css-1dbjc4n")]/@datetime',
    likesCommentsSharesXPath: "//div[contains(@class, 'css-1dbjc4n')]//span[contains(@class, 'css-1dbjc4n')]",
    postUrlXPath: '//a[contains(@class, "css-1dbjc4n")]/@href',
    descriptionXPath: '//div[contains(@class, "css-901oao")]/span',
    viewMoreDivXPath: '//div[contains(@class, "css-1dbjc4n")]//button[contains(., "Ver más")]',
};

// XPaths para Facebook
const facebookXPaths = {
    commentsDivXPath: '//div[contains(@class, "UFIComment")]',
    allCommentsXPath: '//div[contains(@class, "UFICommentBody")]',
    level2CommentsXPath: '//div[contains(@class, "UFIComment")]//div[contains(@class, "UFIReply")]',
    publisherProfileUrlXPath: '//a[contains(@href, "/profile.php?")]',
    nicknameAndTimePublishedAgoXPath: '//a[contains(@class, "profileLink")]/span',
    likesCommentsSharesXPath: "//span[contains(@class, 'UFIActivity')]/span",
    postUrlXPath: '//div[contains(@class, "shareLink")]/a/@href',
    descriptionXPath: '//div[contains(@class, "userContent")]/span',
    viewMoreDivXPath: '//div[contains(@class, "UFIReplyLink") and contains(., "Ver más")]',
};

// Elige los XPaths correspondientes a la red social seleccionada
let xPaths;
if (socialNetwork === "instagram") {
    xPaths = instagramXPaths;
} else if (socialNetwork === "twitter") {
    xPaths = twitterXPaths;
} else if (socialNetwork === "facebook") {
    xPaths = facebookXPaths;
} else {
    throw new Error("Red social no soportada.");
}

// Función para obtener elementos usando XPath.
function getElementsByXPath(xpath, parent) {
    const results = [];
    const query = document.evaluate(xpath, parent || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

// Escapa las comillas dobles en una cadena para usarla en CSV.
function quoteString(s) {
    return '"' + String(s).replaceAll('"', '""') + '"';
}

// Formatea una fecha de la forma MM-DD-YYYY a DD-MM-YYYY.
function formatDate(strDate) {
    if (strDate) {
        const f = strDate.split('-');
        if (f.length === 1) {
            return strDate;
        } else if (f.length === 2) {
            return `${f[1]}-${f[0]}-${new Date().getFullYear()}`;
        } else if (f.length === 3) {
            return `${f[2]}-${f[1]}-${f[0]}`;
        } else {
            return 'Fecha malformada';
        }
    } else {
        return 'Sin fecha';
    }
}

// Función principal para cargar comentarios y generar el CSV.
async function loadCommentsAndGenerateCSV() {
    // Carga los comentarios de nivel 1.
    let loadingCommentsBuffer = 30;
    let numOfcommentsBeforeScroll = getElementsByXPath(xPaths.allCommentsXPath).length;

    while (loadingCommentsBuffer > 0) {
        const allComments = getElementsByXPath(xPaths.allCommentsXPath);
        const lastComment = allComments[allComments.length - 1];
        lastComment.scrollIntoView(false);

        const numOfcommentsAftScroll = getElementsByXPath(xPaths.allCommentsXPath).length;

        // Si no se cargaron nuevos comentarios después de 15 iteraciones, termina.
        if (numOfcommentsAftScroll !== numOfcommentsBeforeScroll) {
            loadingCommentsBuffer = 15;
        } else {
            const commentsDiv = getElementsByXPath(xPaths.commentsDivXPath)[0];
            commentsDiv.scrollIntoView(false);
            loadingCommentsBuffer--;
        }

        numOfcommentsBeforeScroll = numOfcommentsAftScroll;
        console.log(`Cargando comentarios de primer nivel: ${numOfcommentsAftScroll}`);
        await new Promise(r => setTimeout(r, 300));
    }
    console.log('Todos los comentarios de primer nivel han sido cargados.');

    // Carga los comentarios de nivel 2 (respuestas).
    loadingCommentsBuffer = 5;
    while (loadingCommentsBuffer > 0) {
        const readMoreDivs = getElementsByXPath(xPaths.viewMoreDivXPath);
        for (let i = 0; i < readMoreDivs.length; i++) {
            readMoreDivs[i].click();
        }

        await new Promise(r => setTimeout(r, 500));
        if (readMoreDivs.length === 0) {
            loadingCommentsBuffer--;
        } else {
            loadingCommentsBuffer = 5;
        }
        console.log(`Buffer de carga de respuestas: ${loadingCommentsBuffer}`);
    }
    console.log('Todos los comentarios de segundo nivel (respuestas) han sido cargados.');

    // Extrae los datos de la publicación y los comentarios.
    const comments = getElementsByXPath(xPaths.allCommentsXPath);
    const level2CommentsLength = getElementsByXPath(xPaths.level2CommentsXPath).length;
    const publisherProfileUrl = getElementsByXPath(xPaths.publisherProfileUrlXPath)[0].outerText;
    const nicknameAndTimePublishedAgo = getElementsByXPath(xPaths.nicknameAndTimePublishedAgoXPath)[0].outerText.replaceAll('\n', ' ').split(' · ');
    const url = window.location.href.split('?')[0];
    const likesCommentsShares = extractNumericStats();
    const likes = likesCommentsShares[0].outerText;
    const totalComments = likesCommentsShares[1].outerText;
    const shares = likesCommentsShares[2] ? likesCommentsShares[2].outerText : "N/A";
    const commentNumberDifference = Math.abs(parseInt(totalComments) - comments.length);

    // Genera el CSV con los datos extraídos.
    let csv = `Ahora,${Date()}\n`;
    csv += `URL de la publicación,${url}\n`;
    csv += `Nickname del creador,${nicknameAndTimePublishedAgo[0]}\n`;
    csv += `@ del creador,${publisherProfileUrl}\n`;
    csv += `URL del creador,https://www.${socialNetwork}.com/${publisherProfileUrl}\n`;
    csv += `Hora de publicación,${formatDate(nicknameAndTimePublishedAgo[1])}\n`;
    csv += `Likes de la publicación,${likes}\n`;
    csv += `Compartidos de la publicación,${shares}\n`;
    csv += `Descripción,${quoteString(getElementsByXPath(xPaths.descriptionXPath)[0].outerText)}\n`;
    csv += `Número de comentarios de primer nivel,${comments.length - level2CommentsLength}\n`;
    csv += `Número de comentarios de segundo nivel,${level2CommentsLength}\n`;
    csv += `Total de comentarios (renderizados),${comments.length}\n`;
    csv += `Total de comentarios (reportados),${totalComments}\n`;
    csv += `Diferencia en los comentarios,${commentNumberDifference}\n`;
    csv += 'ID de comentario,Nickname,Usuario @,URL del usuario,Texto del comentario,Tiempo,Me gusta,URL de la foto de perfil,Es un comentario de nivel 2,Usuario al que respondió,Número de respuestas\n';

    let count = 1;
    let totalReplies = 0;
    let repliesSeen = 1;

    // Procesa todos los comentarios y los formatea en CSV.
    for (let i = 0; i < comments.length; i++) {
        csv += `${count},${csvFromComment(comments[i])},`;
        if (i > 0 && isReply(comments[i])) {
            csv += `Sí,${quoteString(getNickname(comments[i - repliesSeen]))},0`;
            repliesSeen += 1;
        } else {
            csv += 'No,---,'; 
            totalReplies = 0;
            repliesSeen = 1;

            // Cuenta el número de respuestas a un comentario.
            for (let j = 1; j < comments.length - i; j++) {
                if (!isReply(comments[i + j])) {
                    break;
                }
                totalReplies += 1;
            }
            csv += totalReplies;
        }
        csv += '\n';
        count++;
    }

    const apparentCommentNumber = parseInt(totalComments);
    console.log(`Comentarios mágicamente faltantes (no renderizados): ${apparentCommentNumber - count + 1} (tienes ${count - 1} de ${apparentCommentNumber})`);
    console.log('¡CSV copiado al portapapeles!');
    copy(csv);
}

// Llamada a la función principal.
loadCommentsAndGenerateCSV();
