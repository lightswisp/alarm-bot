const exec = require('child_process').exec;

function AuthCheck(listener, msg){
    if(listener.authenticated_users.includes(msg.from.id)){
        return true
    }
    return false
}

class BotListener{

    #waiting = {     
        "youtube": false,
        "audio": false
    }
    #player  = null     // in order to control our player

    constructor(bot, authenticated_users){
        this.bot = bot
        this.authenticated_users = authenticated_users
    }
    #AuthCheck(msg){
        return AuthCheck(this, msg)
    }
    #isCommand(text){
        return /\/\w+/.test(text)
    }
    #isLink(text){
        return /https?:\/\/youtu\.be\/.+|https?:\/\/youtube\.com\/.+/.test(text)
    }
    #CommandProcessing(msg){
        // RCE VULNERABLE
        let cmd = msg.text.split(" ")
        let command = cmd[0]
        let args = cmd[1]

        switch(command){
            case "/alarm":
                if(args == "youtube"){
                    this.bot.sendMessage(msg.chat.id, "Теперь отправьте ссылку на видео... ждем!")
                    this.#waiting["youtube"] = true
                }
                else if(args == "audio"){
                    this.bot.sendMessage(msg.chat.id, "Запишите голосовое сообщение... ждем!")
                    this.#waiting["audio"] = true
                }
                else{
                    this.bot.sendMessage(msg.chat.id, "Надо выбрать youtube или audio!")
                    Object.keys(this.#waiting).forEach((k) => this.#waiting[k] = false)
                }
            break;

            case "/kill":
                exec(`pkill mpv`, (err, stdout) =>{
                    if(!err){
                        this.bot.sendMessage(msg.chat.id, "Выключаемся...")
                    }
                })
            break;

            default:
                this.bot.sendMessage(msg.chat.id, "Неизвестная комманда!")
            break
        }
    }
    Listen(){

        console.log("listening...")
        this.bot.on('message', async (msg) => {
            if(!this.#AuthCheck(msg)){	
                this.bot.sendMessage(msg.chat.id, "🚫")
                console.log("Not authenticated:", msg.from)
                return
            }
                console.log(msg)

            if(msg["entities"] && msg["entities"][0]["type"] == "bot_command"){
                this.#CommandProcessing(msg)
            }

            if(msg.voice && this.#waiting["audio"]){
                // if waiting for audio
                let link = await this.bot.getFileLink(msg.voice.file_id)
                console.log("Got audio:", link)
                this.#player = exec(`mpv ${link} --no-video`);
                this.#waiting["audio"] = false
            }
            else if(msg["entities"] && msg["entities"][0]["type"] == "url" && this.#waiting["youtube"]){
                // if waiting for youtube link
                console.log("Got youtube link:", msg.text)
                this.#player = exec(`mpv ${msg.text} --no-video`);
                this.#waiting["youtube"] = false
            }
          

        })

    }
}

module.exports = BotListener
