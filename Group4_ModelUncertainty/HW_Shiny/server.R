library(shiny)

shinyServer(function(input, output){
  
  output$UKhex <- renderImage({
    
    filename <- normalizePath(file.path('./images',
                                        paste('UKhex2','.png', sep='')))
    
    # Return a list containing the filename and alt text
    list(src = filename,
         alt = paste("UK map"),
         width = 500,
         height = 600)
    
  }, deleteFile = FALSE)
  
  
})