import React from 'react'
import 'emoji-mart/css/emoji-mart.css'
import emojiData from 'emoji-mart/data/google.json'
import { NimblePicker } from 'emoji-mart'

export const EmojiPicker = (props) => <NimblePicker set='google' data={emojiData} sheetSize={16} {...props} />