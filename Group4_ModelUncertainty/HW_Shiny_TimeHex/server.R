library(shiny)
library(ggplot2)
library(RColorBrewer)
library(fields)




shinyServer(function(input, output){
  
  output$hexplots <- renderPlot(
    
    Heatmap_Matrix <- matrix(rnorm(4),2,2),
    x <- as.vector(Heatmap_Matrix),
    SOM_Rows <- dim(Heatmap_Matrix)[1],
    SOM_Columns <- dim(Heatmap_Matrix)[2],
    par(mar = c(0.4, 2, 2, 7)),
    plot(0, 0, type = "n", axes = FALSE, xlim=c(0, SOM_Columns),
         ylim=c(0, SOM_Rows), xlab="", ylab= "", asp=1),
    ColRamp <- rev(designer.colors(n=50, col=brewer.pal(9, "Spectral"))),
    ColorCode <- rep("#FFFFFF", length(x)), #default is all white
    Bins <- seq(min(x, na.rm=T), max(x, na.rm=T), length=length(ColRamp)),
    for (i in 1:length(x))
      if (!is.na(x[i])) ColorCode[i] <- ColRamp[which.min(abs(Bins-x[i]))],
    
    #Actual plotting of hexagonal polygons on map
    offset <- 0.5, #offset for the hexagons when moving up a row
    for (row in 1:SOM_Rows) {
      for (column in 0:(SOM_Columns - 1))
        Hexagon(column + offset, row - 1, col = ColorCode[row + SOM_Rows * column])
      offset <- ifelse(offset, 0, 0.5)
    }
    
    
  
  )
  
  
})